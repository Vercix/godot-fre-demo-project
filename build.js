const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const colors = require('colors/safe');
const filesize = require('filesize');
const { glob } = require('glob');



const jsxPluginReact17 = {
	name: 'jsx-react-17',
	setup(build) {

		const babel = require('@babel/core')
		const pluginTransformJsX = require('@babel/plugin-transform-react-jsx')
			.default({}, { runtime: 'automatic', importSource: "../fre-godot" })
		// const pluginTypeScript = require('@babel/plugin-transform-typescript')
		// .default({})

		build.onLoad({ filter: /\.[tj]sx$/ }, async (args) => {
			const start = Date.now();
			const jsx = await fs.promises.readFile(args.path, 'utf8')
			const result = babel.transformSync(jsx, { plugins: [pluginTransformJsX] })
			console.log(`[${Date.now() - start}ms]`, colors.green(`Build ${build.initialOptions.entryPoints} ==> ${build.initialOptions.outfile}`));
			return { contents: result.code }
		})
	},
}

const injectFre = {
	name: 'inject-fre',
	setup(build) {


		build.onLoad({ filter: /\.[tj]sx$/ }, async (args) => {
			const start = Date.now();
			const fileString = await fs.promises.readFile(args.path, 'utf8')
			// const result = babel.transformSync(jsx, { plugins: [pluginTransformJsX] })
			console.log(`[${Date.now() - start}ms]`, colors.green(`Build ${build.initialOptions.entryPoints} ==> ${build.initialOptions.outfile}`));
			
			function getRelPath(x){
				if(x < 1 ){
					return './'
				}
				return '../'.repeat(x)
			}

			//Hard coded, will case issue if project structure modified.
			//Need some way to check relative path from file to where fregodot bundle is compiled to0
			const relPath = getRelPath(build.initialOptions.outfile.split('/').length - 3)  
			
			const result = `import { jsx as _jsx, Fragment } from "${relPath}fre-godot/jsx-runtime" \n` + fileString
			return { 
				contents: result,
				loader : 'tsx'
			}
		})
	},
}

const options = {
	sourceRoot: 'src',
	outRoot: 'project/dist',
	tsconfig: 'tsconfig.json',
}

const scripts = require('./scripts.json');

function normalize_path(path) {
	return path.replace(/\\/g, '/');
}

function update_entries() {
	let patterns = scripts.bundles || [];
	scripts.bundles = [];
	for (const p of patterns) {
		const inputs = glob.sync(p);
		scripts.bundles = scripts.bundles.concat(inputs);
	}
	patterns = scripts.compile_only || [];
	scripts.compile_only = [];
	for (const p of patterns) {
		const inputs = glob.sync(p);
		scripts.compile_only = scripts.compile_only.concat(inputs);
	}
}

function clean() {
	fs.rmdirSync(options.outRoot, { recursive: true });
}

function watch() {
	update_entries();
	chokidar.watch(options.sourceRoot).on('all', (event, input) => {
		if (!fs.existsSync(input) || !fs.statSync(input).isFile()) return;
		input = normalize_path(input);
		let output = null;
		switch (event) {
			case 'add':
				update_entries();
				output = get_build_target(input);
			case 'change':
				output = get_build_target(input);
				break;
			case 'unlink': {
				const last = get_build_target(input);
				update_entries();
				output = get_build_target(input);
				if (!output && last) {
					console.log('remove', last);
				}
			} break;
		}
		if (output) {
			build_entry(input, output);
		}
	});
}

function get_build_target(input) {
	const matches = input.match(/(\.d)?(\.[t|j]sx?)/);
	if (!matches) return;
	if (matches[0] === '.d.ts') return;
	if (scripts.bundles.indexOf(input) == -1 && scripts.compile_only.indexOf(input) == -1) return;
	const target = path.join(options.outRoot, input.replace(options.sourceRoot, '')).replace('.ts', '.js');
	return normalize_path(target);
}

function entry_is_bundle(input) {
	return scripts.bundles.indexOf(input) != -1;
}

async function build_entry(input, outfile) {
	const start = Date.now();
	try {
		esbuild.build({
			entryPoints: [input],
			outfile,
			target: 'esnext',
			format: 'esm',
			tsconfig: options.tsconfig,
			sourcemap: true,
			bundle: entry_is_bundle(input),
			jsx: 'transform',
			jsxFactory: '_jsx',
			jsxFragment: 'Fragment',
			//inject: ['./src/fre-godot/fre-godot-shim.js'],
			loader: { '.js': 'jsx' },
			plugins: [injectFre],
		});
		console.log(`[${Date.now() - start}ms]`, colors.green(`Build ${input} ==> ${outfile}`), colors.grey(filesize(fs.statSync(outfile).size)));
	} catch (error) {
	}
}

clean();
watch();