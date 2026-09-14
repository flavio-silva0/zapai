const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../..'),out=path.resolve(__dirname,'../evidence');
const run=args=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
const files=run(['ls-files']).trim().split('\n');
const inventory=files.map(file=>{const b=fs.readFileSync(path.join(root,file));return {file,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex'),lines:/\.(js|jsx|sql|md|json|css|html)$/.test(file)?b.toString('utf8').split('\n').length:undefined}});
fs.writeFileSync(path.join(out,'repository-inventory.json'),JSON.stringify({commit:run(['rev-parse','HEAD']).trim(),files:inventory},null,2));
const patterns=[['google',/AIza[0-9A-Za-z_-]{30,}/g],['private_key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],['provider_key',/\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{24,}/g],['github_token',/\bgh[pousr]_[A-Za-z0-9]{25,}/g],['jwt_literal',/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/g],['credential_url',/postgres(?:ql)?:\/\/[^\s"']+:[^\s"'@]+@[^\s"']+/g],['meta_token',/\bEAA[A-Za-z0-9]{65,}/g]];
const hits=[];const objects=run(['rev-list','--objects','--all']).trim().split('\n');let scanned=0;
for(const row of objects){const [hash,...parts]=row.split(' ');const file=parts.join(' ');if(!file||!/(\.(?:js|jsx|json|md|txt|yml|yaml|sql|env)|\.env.*)$/.test(file)||file.includes('package-lock'))continue;let body;try{body=run(['cat-file','blob',hash])}catch{continue}scanned++;for(const [type,re] of patterns){re.lastIndex=0;let m;while((m=re.exec(body)))hits.push({type,file,object:hash,line:body.slice(0,m.index).split('\n').length,value:'REDACTED'});}}
fs.writeFileSync(path.join(out,'secret-scan.json'),JSON.stringify({scope:'All locally reachable Git blobs, selected text extensions; regex heuristic, not proof of no secrets',scanned,hits},null,2));
console.log(JSON.stringify({trackedFiles:files.length,scanned,hits:hits.map(({type,file,line})=>({type,file,line}))},null,2));
