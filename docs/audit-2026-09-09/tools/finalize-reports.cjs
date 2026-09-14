const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const dir = path.resolve(__dirname, '..');
const generator = path.join(__dirname, 'write-reports.cjs');
let source = fs.readFileSync(generator, 'utf8');
const replacements = [
 ['Código TestZapAi linhas 10 e 45; AuthContext logout; teste de troca de conta previsto em E2E.', 'focused-e2e.json: login A, histórico-canário fictício, logout e login B no mesmo navegador; B visualizou o histórico de A.'],
 ['Prova de código; não confundir com vazamento entre máquinas.', 'Reproduzido no navegador com duas contas e canário fictício (focused-e2e.json); limitado ao mesmo perfil de navegador.'],
 ['inspeção humana', 'inspeção visual'],
 ['persistência API verificada; sliders não persistem. Testar UI real na regressão.', 'edição, salvamento e reload pela UI passaram; prompt original restaurado. Slider alterado para 12 voltou a 65 após reload (focused-e2e.json).'],
 ['guard client verificado por navegação anônima; revogação server não existe.', 'login/logout reais pela UI e redirecionamento anônimo passaram; troca A→B revelou histórico de sandbox de A. Revogação server não existe.'],
 ['não há E2E/DB nem typecheck.', 'suite original não possui E2E/DB nem typecheck; provas locais foram adicionadas nesta auditoria.']
];
for (const [before, after] of replacements) source = source.split(before).join(after);
fs.writeFileSync(generator, source);
cp.execFileSync(process.execPath, [generator], {stdio:'inherit'});
const mission = fs.readFileSync('C:/Users/FlavioJuniorCarvalho/.codex/attachments/2e3fa3b5-4a1d-4a5e-a0e6-7a17c34518e1/pasted-text.txt','utf8');
const reports = fs.readdirSync(dir).filter(f => /^\d\d_.*\.md$/.test(f));
function reportFor(n) {
 if ([1,2].includes(n)) return 1;
 if ([3,4].includes(n)) return 2;
 if ([5,7,18,19,20,21,22,59,80].includes(n)) return 3;
 if ([6,33,42].includes(n)) return 4;
 if ([8,17,34].includes(n)) return 5;
 if ((n>=9&&n<=16)||n===62) return 6;
 if ((n>=24&&n<=32)||[38,60,64].includes(n)) return 7;
 if ((n>=35&&n<=37)||(n>=43&&n<=45)||[58,61,63].includes(n)) return 8;
 if ((n>=46&&n<=50)||[76,77].includes(n)) return 9;
 if ([51,52,53].includes(n)) return 10;
 if ([39,40,41].includes(n)) return 11;
 if ((n>=54&&n<=57)||[79,81].includes(n)) return 12;
 if (n===70) return 13;
 if ((n>=71&&n<=75)||[23,84].includes(n)) return 14;
 if ([68,69,85,88].includes(n)) return 0;
 return 15;
}
const rows = [...mission.matchAll(/^# (\d+)\. (.+)$/gm)].map(m => {
 const n=Number(m[1]), file=reports.find(f=>f.startsWith(String(reportFor(n)).padStart(2,'0')+'_'));
 const limitation = [6,42,43,45].includes(n) ? 'Código/local avaliados; catálogo, backups e configuração cloud não verificados' : [8,9,14,15,16,17,62].includes(n) ? 'Código e simulação local; integração/qualidade/custo real não medidos' : [30,31,32,64].includes(n) ? 'Navegação e amostra visual; sem certificação WCAG ou carga representativa' : [56,57].includes(n) ? 'Revisão dos caminhos e matriz proposta; chaos/multiworker não executados' : 'Evidências, classificação e limitações no relatório indicado';
 return `| ${n}. ${m[2].trim()} | [${file}](${file}) | ${limitation} |`;
});
fs.appendFileSync(path.join(dir,'15_FULL_AUDIT.md'), '\n\n## Rastreabilidade das 88 seções solicitadas\n\nEsta matriz indica onde cada tópico foi tratado; não transforma itens não verificáveis em testes aprovados.\n\n| Seção da missão | Relatório | Cobertura / limite |\n|---|---|---|\n'+rows.join('\n')+'\n');
const baseline = JSON.parse(fs.readFileSync(path.join(dir,'evidence/repository-inventory.json'),'utf8'));
const changed = baseline.files.filter(f=>crypto.createHash('sha256').update(fs.readFileSync(f.file)).digest('hex')!==f.sha256).map(f=>f.file);
const syntax = [];
for (const f of baseline.files.filter(f=>f.file.startsWith('src/')&&f.file.endsWith('.js'))) {
 cp.execFileSync(process.execPath, ['--check',f.file]); syntax.push(f.file);
}
const evidence={verifiedAt:new Date().toISOString(),originalTrackedFilesChangedSinceInventory:changed,syntaxChecked:syntax,missionSections:rows.length,reportCount:reports.length,score:35,existingTests:'4 scripts passed with fictitious JWT_SECRET and USE_REAL_GEMINI=false',frontendLint:'passed; disabled rules documented',frontendBuild:'passed; Browserslist warning',focusedE2E:JSON.parse(fs.readFileSync(path.join(dir,'evidence/focused-e2e.json'),'utf8')),limitations:['No production authenticated mutation or real Meta/LLM call','Reconstructed local schema is not production Supabase verification']};
fs.writeFileSync(path.join(dir,'evidence/final-validation.json'),JSON.stringify(evidence,null,2));
console.log(JSON.stringify({changed,syntaxFiles:syntax.length,sections:rows.length,reports:reports.length}));
if(changed.length) process.exitCode=1;
