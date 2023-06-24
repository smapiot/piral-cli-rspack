import { ConcatSource } from "webpack-sources";
import { Compilation, Compiler } from "@rspack/core";

const COMMENT_END_REGEX = /\*\//g;

function asRegExp(test: string | RegExp) {
	if (typeof test === "string") {
		test = new RegExp("^" + test.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"));
	}

	return test;
};

function matchPart(str: string, test: string | RegExp) {
	if (!test) {
    return true;
  }

	test = asRegExp(test);

	if (Array.isArray(test)) {
		return test.map(asRegExp).some(regExp => regExp.test(str));
	}

  return test.test(str);
}

function matchObject(obj: any, str: string) {
	if (obj.test) {
		if (!matchPart(str, obj.test)) {
			return false;
		}
	}

	if (obj.include) {
		if (!matchPart(str, obj.include)) {
			return false;
		}
	}

	if (obj.exclude) {
		if (matchPart(str, obj.exclude)) {
			return false;
		}
	}
	return true;
}

function toComment(str: string) {
  if (!str) {
    return "";
  }

  return `/*! ${str.replace(COMMENT_END_REGEX, "* /")} */`;
}

function wrapComment(str: string) {
	if (!str.includes("\n")) {
		return toComment(str);
	}

	return `/*!\n * ${str
		.replace(/\*\//g, "* /")
		.split("\n")
		.join("\n * ")
		.replace(/\s+\n/g, "\n")
		.trimEnd()}\n */`;
}

interface BannerPluginOptions {
  banner: string;
  entryOnly: boolean;
  include: string;
  raw: boolean;
}

export class BannerPlugin {
  private banner: string;

	constructor(private options: BannerPluginOptions) {
		const bannerOption = options.banner;

    this.banner = this.options.raw
      ? bannerOption
      : wrapComment(bannerOption);
	}

	apply(compiler: Compiler) {
		const options = this.options;
		const banner = this.banner;
		const cache = new WeakMap();

		compiler.hooks.compilation.tap("BannerPlugin", compilation => {
			compilation.hooks.processAssets.tap(
				{
					name: "BannerPlugin",
					stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
				},
				() => {
					for (const chunk of compilation.chunks) {
						if (options.entryOnly && !chunk.initial) {
							continue;
						}

						for (const file of chunk.files) {
							if (!matchObject(options, file)) {
								continue;
							}

							const data = {
								// chunk,
								filename: file
							};

							const comment = compilation.getPath(banner, data);

							compilation.updateAsset(file, old => {
								let cached = cache.get(old);

								if (!cached || cached.comment !== comment) {
									const source = new ConcatSource(comment, "\n", old);
									cache.set(old, { source, comment });
									return source;
								}

								return cached.source;
							}, undefined);
						}
					}
				}
			);
		});
	}
}
