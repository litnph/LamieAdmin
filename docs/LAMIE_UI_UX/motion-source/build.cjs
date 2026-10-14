const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const notices = ['Lucide Animated — https://lucide-animated.com\n' + fs.readFileSync(path.join(__dirname,'Lucide-Animated-LICENSE.txt'),'utf8')];
for (const name of ['react','react-dom','scheduler','motion','framer-motion','motion-dom','motion-utils']) {
  const directory = path.join(__dirname,'node_modules',name);
  const license = fs.readdirSync(directory).find(name => /^LICENSE(\.md)?$/.test(name));
  notices.push(name + '\n' + fs.readFileSync(path.join(directory,license),'utf8'));
}
fs.writeFileSync(path.join(__dirname,'THIRD_PARTY_NOTICES.txt'),notices.join('\n\n'));
esbuild.buildSync({
  entryPoints: [path.join(__dirname, 'bridge.tsx')],
  outfile: path.join(__dirname, 'motion-bundle.js'),
  bundle: true, minify: true, format: 'iife', platform: 'browser', target: 'es2020',
  jsx: 'automatic', define: {'process.env.NODE_ENV': '"production"'},
  alias: {'@/lib/utils': path.join(__dirname, 'utils.ts')},
  legalComments: 'inline',
  banner: {js: '/*! ' + notices.join('\n\n') + '*/'}
});
const app = path.join(__dirname,'../mockup/app.js');
if (fs.existsSync(app)) fs.writeFileSync(path.join(__dirname,'app.min.js'),esbuild.transformSync(fs.readFileSync(app,'utf8'),{minify:true,target:'es2020',charset:'utf8',legalComments:'inline'}).code);
console.log('Motion bundle:', fs.statSync(path.join(__dirname,'motion-bundle.js')).size, 'bytes');
