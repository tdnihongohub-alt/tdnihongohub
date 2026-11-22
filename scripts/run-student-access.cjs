const path=require('path'),fs=require('fs'),os=require('os'),esbuild=require('esbuild');
const out=path.join(os.tmpdir(),'td-student-access-worker-'+process.pid+'.cjs');
esbuild.buildSync({entryPoints:[path.join(__dirname,'student-access-worker.ts')],bundle:true,platform:'node',target:'node22',format:'cjs',outfile:out});
const {runWorker}=require(out);
runWorker({projectId:process.env.FIREBASE_PROJECT_ID||'td-nihongo-hub',token:process.env.GOOGLE_OAUTH_ACCESS_TOKEN||'',apply:process.argv.includes('--apply')}).then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});
