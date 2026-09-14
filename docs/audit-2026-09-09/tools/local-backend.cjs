// Only this audit launcher uses mocks. src/ remains unchanged.
const path=require('path');const root=path.resolve(__dirname,'../../..');
if(process.env.SUPABASE_URL!=='http://127.0.0.1:55434')throw Error('Local database required');
const sdk=require(path.join(root,'node_modules/@google/generative-ai'));
sdk.GoogleGenerativeAI.prototype.getGenerativeModel=function(){
 const result=text=>({response:{text:()=>text},embedding:{values:Array(768).fill(0.01)}});
 return {embedContent:async()=>result(''),generateContent:async input=>result(typeof input==='string'&&input.includes('analista de dados')?'{}':'Você é a Zap. DEMONSTRAÇÃO LOCAL: responda sobre a empresa fictícia e encaminhe dúvidas para uma pessoa.'),startChat:()=>({sendMessage:async()=>result('Esta é uma resposta simulada da Zap no ambiente local. Como posso ajudar com seu atendimento?')})};
};
const axios=require(path.join(root,'node_modules/axios'));
axios.defaults.adapter=async config=>{if(String(config.url).startsWith('https://graph.facebook.com/')&&config.method==='post')return {data:{messages:[{id:'LOCAL_MOCK'}]},status:200,statusText:'OK',headers:{},config};throw Error('External Axios request blocked in local audit')};
const originalFetch=global.fetch;
global.fetch=(input,options)=>{const url=new URL(typeof input==='string'?input:input.url||input);if(!['127.0.0.1','localhost'].includes(url.hostname))return Promise.reject(Error('External fetch blocked in local audit'));return originalFetch(input,options)};
const {app}=require(path.join(root,'src/index'));
app.listen(3001,'127.0.0.1',()=>console.log('AUDIT LOCAL: Express with real local database and simulated Meta/Gemini'));
