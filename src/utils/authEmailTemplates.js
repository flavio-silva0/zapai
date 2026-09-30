"use strict";
// Table layout and inline styles keep the essential design usable in email clients.
function buildAuthEmail(kind, { logoUrl, font }) {
  if (!/^https:\/\//.test(logoUrl) || /["<>]/.test(logoUrl)) throw new Error('Invalid public logo URL');
  const confirm = kind === 'confirmation';
  const text = confirm ? {
    preheader: 'O seu próximo capítulo começa aqui. Confirme seu e-mail e dê o primeiro passo com o ZapAI.',
    badge: 'BEM-VINDO AO ZAPAI', hero: 'Seu atendimento,<br>em uma nova fase.',
    subtitle: 'Mais espaço para o seu negócio.<br>Mais atenção para cada conversa.',
    title: 'Falta só confirmar<br>seu e-mail.',
    intro: 'Você está a um clique de começar. Confirme seu endereço de e-mail para ativar sua conta e preparar o atendimento do seu negócio com o ZapAI.',
    button: 'Confirmar meu e-mail', caption: 'Um passo simples para começar com segurança.',
    panelTitle: 'O que vem depois?', panelIntro: 'Do primeiro acesso à sua operação organizada.',
    steps: [['01','Confirme seu e-mail','Ative sua conta e conclua seus dados de cadastro.'],['02','Prepare seu assistente','Personalize o atendimento com as informações do seu negócio.'],['03','Organize suas conversas','Configure seus canais e acompanhe o atendimento pelo painel.']],
    closing: 'Cada conversa é uma oportunidade.', closingSub: 'Vamos construir o próximo passo do seu negócio.',
    disclaimer: 'Você recebeu esta mensagem porque um cadastro foi iniciado com este e-mail. Se não foi você, basta ignorar. Sua conta só será ativada após a confirmação.',
  } : {
    preheader: 'Redefina sua senha e retome o acesso à sua conta ZapAI.',
    badge: 'ACESSO À SUA CONTA', hero: 'Volte para<br>o que importa.',
    subtitle: 'Seu negócio. Suas conversas.<br>Tudo pronto para você continuar.',
    title: 'Um novo acesso.<br>A mesma conta.',
    intro: 'Recebemos uma solicitação para redefinir sua senha. Toque no botão abaixo e escolha uma nova senha para voltar ao seu painel ZapAI.',
    button: 'Criar nova senha', caption: 'Este link é pessoal. Use-o apenas para sua própria conta.',
    panelTitle: 'Seu próximo acesso, mais seguro.', panelIntro: 'Uma boa senha protege suas conversas e sua operação.',
    steps: [['01','Crie uma senha forte','Use pelo menos 10 caracteres, combinando letras e números.'],['02','Escolha uma senha exclusiva','Evite repetir a senha que você usa em outros serviços.'],['03','Retome seu atendimento','Depois de salvar, faça login normalmente no ZapAI.']],
    closing: 'Sua operação merece cuidado.', closingSub: 'Proteja seu acesso. Continue de onde parou.',
    disclaimer: 'Se você não pediu a alteração de senha, ignore esta mensagem. Sua senha atual permanece a mesma até que uma nova seja salva.',
  };
  const rows = text.steps.map(([number, title, description], i) => `<tr><td width="42" valign="top" style="font-family:Inter,Arial,Helvetica,sans-serif;padding:${i ? '18px' : '0'} 12px 0 0;font-size:12px;line-height:22px;font-weight:800;letter-spacing:1px;color:#3260e9">${number}</td><td valign="top" style="font-family:Inter,Arial,Helvetica,sans-serif;padding:${i ? '18px' : '0'} 0 0"><p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0 0 4px;font-size:15px;line-height:22px;font-weight:700;color:#152244">${title}</p><p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0;font-size:13px;line-height:21px;color:#53627d">${description}</p></td></tr>`).join('');
  return `<!doctype html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>ZapAI</title>
<!--[if !mso]><!--><link rel="stylesheet" href="${font.url}"><!--<![endif]-->
<style>${font.css}
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}table{border-collapse:collapse}img{border:0;outline:none;text-decoration:none}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}@media only screen and (max-width:620px){.outer{padding:16px 10px!important}.pad{padding-left:24px!important;padding-right:24px!important}.hero-title{font-size:33px!important;line-height:38px!important}.heading{font-size:25px!important;line-height:31px!important}.logo{width:156px!important;height:auto!important}.brand-meta{font-size:9px!important;letter-spacing:1px!important}.panel-pad{padding:23px 20px!important}}</style></head>
<body style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0;padding:0;background-color:#edf1f8;font-family:Inter,Arial,Helvetica,sans-serif;color:#152244">
<div style="font-family:Inter,Arial,Helvetica,sans-serif;display:none;font-size:1px;color:#edf1f8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${text.preheader}</div>
<table role="presentation" width="100%" bgcolor="#edf1f8" style="font-family:Inter,Arial,Helvetica,sans-serif;background-color:#edf1f8"><tr><td align="center" class="outer" style="font-family:Inter,Arial,Helvetica,sans-serif;padding:36px 16px">
<!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
<table role="presentation" width="100%" bgcolor="#ffffff" style="font-family:Inter,Arial,Helvetica,sans-serif;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e1e7f2">
<tr><td class="pad" style="font-family:Inter,Arial,Helvetica,sans-serif;padding:27px 38px;background-color:#ffffff"><table role="presentation" width="100%"><tr><td><img class="logo" src="${logoUrl}" width="174" height="56" alt="ZapAI" style="font-family:Inter,Arial,Helvetica,sans-serif;display:block;width:174px;height:56px;object-fit:contain"></td><td align="right" class="brand-meta" style="font-family:Inter,Arial,Helvetica,sans-serif;font-size:10px;line-height:16px;font-weight:700;letter-spacing:1.5px;color:#64748b">CONEXÃO.<br>INTELIGÊNCIA.</td></tr></table></td></tr>
<tr><td class="pad" bgcolor="#1649da" style="font-family:Inter,Arial,Helvetica,sans-serif;padding:36px 38px 39px;background-color:#1649da;background-image:linear-gradient(125deg,#1034a6 0%,#2157ec 64%,#3970fa 100%)">
<p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0 0 20px;font-size:10px;line-height:18px;font-weight:800;letter-spacing:2px;color:#c7ddff">${text.badge}</p>
<h1 class="hero-title" style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0;font-size:40px;line-height:45px;font-weight:700;letter-spacing:-1.2px;color:#ffffff">${text.hero}</h1>
<p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:19px 0 0;font-size:15px;line-height:24px;color:#dbe8ff">${text.subtitle}</p>
</td></tr>
<tr><td class="pad" style="font-family:Inter,Arial,Helvetica,sans-serif;padding:34px 38px 0">
<p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0 0 11px;font-size:10px;line-height:16px;font-weight:800;letter-spacing:1.7px;color:#3260e9">${confirm ? 'SEU PRIMEIRO PASSO' : 'RECUPERAÇÃO DE SENHA'}</p>
<h2 class="heading" style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0 0 17px;font-size:28px;line-height:34px;font-weight:700;letter-spacing:-.84px;color:#1a1a1a">${text.title}</h2>
<p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0;font-size:15px;line-height:25px;font-weight:400;color:#525252">${text.intro}</p>
<table role="presentation" width="100%" style="font-family:Inter,Arial,Helvetica,sans-serif;margin-top:24px"><tr><td align="center" bgcolor="#2655e8" style="font-family:Inter,Arial,Helvetica,sans-serif;border-radius:10px;background-color:#2655e8;mso-padding-alt:17px 20px"><a href="{{ .ConfirmationURL }}" style="font-family:Inter,Arial,Helvetica,sans-serif;display:block;padding:17px 20px;font-size:15px;line-height:22px;font-weight:600;text-align:center;text-decoration:none;color:#ffffff;border:1px solid #2655e8;border-radius:10px">${text.button} &nbsp; &#8594;</a></td></tr></table>
<p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:12px 0 0;font-size:11px;line-height:18px;text-align:center;color:#687790">${text.caption}</p>
</td></tr>
<tr><td class="pad" style="font-family:Inter,Arial,Helvetica,sans-serif;padding:29px 38px 0"><table role="presentation" width="100%" bgcolor="#f1f5ff" style="font-family:Inter,Arial,Helvetica,sans-serif;background-color:#f1f5ff;border:1px solid #e3ebff;border-radius:12px"><tr><td class="panel-pad" style="font-family:Inter,Arial,Helvetica,sans-serif;padding:26px"><h3 style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0 0 6px;font-size:18px;line-height:25px;font-weight:700;letter-spacing:-.54px;color:#152244">${text.panelTitle}</h3><p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0 0 22px;font-size:13px;line-height:21px;color:#64748b">${text.panelIntro}</p><table role="presentation" width="100%">${rows}</table></td></tr></table></td></tr>
<tr><td class="pad" style="font-family:Inter,Arial,Helvetica,sans-serif;padding:28px 38px"><p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0 0 5px;font-size:16px;line-height:24px;font-weight:700;color:#152244">${text.closing}</p><p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0;font-size:13px;line-height:22px;color:#64748b">${text.closingSub}</p><p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:15px 0 0;font-size:13px;line-height:21px;font-weight:700;color:#3260e9">Equipe ZapAI</p></td></tr>
<tr><td class="pad" bgcolor="#f8faff" style="font-family:Inter,Arial,Helvetica,sans-serif;padding:24px 38px;background-color:#f8faff;border-top:1px solid #e7edf7"><p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0 0 7px;font-size:11px;line-height:18px;font-weight:700;color:#52627d">O botão não abriu?</p><p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0 0 14px;font-size:11px;line-height:18px;color:#697993">Copie e cole este link no navegador:</p><p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0 0 17px;font-size:10px;line-height:17px;word-break:break-all;overflow-wrap:anywhere"><a href="{{ .ConfirmationURL }}" style="font-family:Inter,Arial,Helvetica,sans-serif;color:#3260e9;text-decoration:underline;word-break:break-all">{{ .ConfirmationURL }}</a></p><p style="font-family:Inter,Arial,Helvetica,sans-serif;margin:0;font-size:10px;line-height:18px;color:#697993">${text.disclaimer} Não encaminhe este link.</p></td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
<p style="font-family:Inter,Arial,Helvetica,sans-serif;max-width:600px;margin:20px 0 0;font-size:10px;line-height:18px;letter-spacing:1.2px;color:#77849a">ZAPAI &nbsp;·&nbsp; CONEXÃO, INTELIGÊNCIA E CONFIANÇA</p>
</td></tr></table></body></html>`;
}
module.exports = { buildAuthEmail };
