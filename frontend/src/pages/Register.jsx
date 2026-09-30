import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, MailCheck, Check, ArrowRight } from "lucide-react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { googleSignIn, registrationClient } from "../registrationAuth";

const STATES = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
const SEGMENTS = { dental: "Clínica odontológica", imobiliaria: "Imobiliária", saude: "Saúde / Estética", varejo: "Varejo / E-commerce", servicos: "Prestação de serviços", alimentacao: "Restaurante / Delivery", educacao: "Educação / Cursos", outro: "Outro segmento" };
function cpfValid(value) {
  const c = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(c) || /^(\d)\1+$/.test(c)) return false;
  return [9,10].every(n => Number(c[n]) === (([...c.slice(0,n)].reduce((s,d,i) => s + Number(d)*(n+1-i),0)*10)%11)%10);
}
function mask(value, kind) {
  const d = value.replace(/\D/g, "");
  if (kind === "cpf") return d.slice(0,11).replace(/^(\d{3})(\d)/,"$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/,"$1.$2.$3").replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/,"$1.$2.$3-$4");
  if (kind === "cep") return d.slice(0,8).replace(/^(\d{5})(\d)/,"$1-$2");
  return d.slice(0,11).replace(/^(\d{2})(\d)/,"($1) $2").replace(/(\d{4,5})(\d{4})$/, "$1-$2");
}
export default function Register() {
  const navigate = useNavigate(); const { login } = useAuth(); const [params] = useSearchParams();
  const google = params.get("completar") === "1";
  const [step, setStep] = useState(1); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [sent, setSent] = useState(false); const [show, setShow] = useState(false); const [cooldown, setCooldown] = useState(0);
  const [form, setForm] = useState({ nome:"", email:"", cpf:"", phone:"", birthDate:"", password:"", confirmPassword:"", cep:"", street:"", number:"", complement:"", district:"", city:"", state:"", businessName:"", nicho:"", acceptPrivacy:false });
  useEffect(() => {
    if (!google) return;
    registrationClient().then(async ({ client }) => {
      const { data } = await client.auth.getUser();
      if (!data.user?.email_confirmed_at) throw new Error("Entre com Google novamente para continuar.");
      setForm(f => ({ ...f, nome:data.user.user_metadata?.full_name || "", email:data.user.email }));
    }).catch(e => setError(e.message));
  }, [google]);
  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown(c => c - 1),1000); return () => clearTimeout(t);
  }, [cooldown]);
  const update = field => e => setForm(f => ({ ...f, [field]: ["cpf","phone","cep"].includes(field) ? mask(e.target.value,field) : e.target.value }));
  function validate(part) {
    if (part === 1) {
      if (form.nome.trim().split(/\s+/).length < 2) return "Informe seu nome completo.";
      if (!cpfValid(form.cpf)) return "Informe um CPF válido.";
      if (!/^[1-9]\d{9,10}$/.test(form.phone.replace(/\D/g,""))) return "Informe seu telefone com DDD.";
      const birth = new Date(form.birthDate + "T12:00:00Z"); const adult = new Date(); adult.setFullYear(adult.getFullYear()-18);
      if (!form.birthDate || !Number.isFinite(+birth) || birth > adult || birth.getFullYear() < new Date().getFullYear()-120) return "Informe uma data de nascimento válida. Você deve ter pelo menos 18 anos.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Informe um e-mail válido.";
      if (!google && (form.password.length < 10 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password) || new TextEncoder().encode(form.password).length > 72)) return "Use uma senha com 10 ou mais caracteres, letras e números (máximo de 72 bytes).";
      if (!google && form.password !== form.confirmPassword) return "As senhas precisam ser iguais.";
    }
    if (part === 2 && (!/^\d{8}$/.test(form.cep.replace(/\D/g,"")) || !form.street.trim() || !form.number.trim() || !form.district.trim() || !form.city.trim() || !form.state)) return "Preencha seu endereço completo, incluindo CEP e UF.";
    if (part === 3 && (form.businessName.trim().length < 2 || !form.nicho || !form.acceptPrivacy)) return "Informe sua empresa, o segmento e aceite a Política de Privacidade.";
    return "";
  }
  async function submit(e) {
    e.preventDefault(); if (loading) return; setError(""); setNotice("");
    const issue = validate(step); if (issue) { setError(issue); return; }
    if (step < 3) { setStep(step + 1); return; }
    for (const part of [1,2]) { const err = validate(part); if (err) { setStep(part); setError(err); return; } }
    setLoading(true);
    try {
      let body = { ...form }; let path = "/api/auth/register";
      if (google) {
        const { client } = await registrationClient(); const { data } = await client.auth.getSession();
        if (!data.session) throw new Error("Sua sessão expirou. Entre com Google novamente.");
        path = "/api/auth/session"; body = { accessToken:data.session.access_token, profile:form };
      }
      const res = await apiFetch(path, { method:"POST", body:JSON.stringify(body) }); const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Não foi possível criar sua conta.");
      if (google) {
        login(result.token,result.user,result.tenant); const { client } = await registrationClient(); await client.auth.signOut({ scope:"local" }); navigate("/painel",{ replace:true });
      } else { setSent(true); setCooldown(60); setForm(f => ({ ...f, password:"", confirmPassword:"" })); }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  async function resend() {
    setLoading(true); setError(""); setNotice("");
    try { const res = await apiFetch("/api/auth/resend", { method:"POST", body:JSON.stringify({ email:form.email }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); setNotice(data.message); setCooldown(60); } catch(e) { setError(e.message); } finally { setLoading(false); }
  }
  async function startGoogle() { setLoading(true); setError(""); try { await googleSignIn(); } catch(e) { setError(e.message); setLoading(false); } }
  function field(key, label, type="text", autoComplete, placeholder, optional=false) {
    return <label className="block text-sm font-semibold" htmlFor={"reg-"+key}>{label}{optional && <span className="text-[var(--text-muted)] font-normal"> (opcional)</span>}<input id={"reg-"+key} name={key} type={type} autoComplete={autoComplete} placeholder={placeholder} required={!optional} maxLength={type === "date" ? undefined : 180} inputMode={["cpf","phone","cep"].includes(key) ? "numeric" : undefined} readOnly={key === "email" && google} value={form[key]} onChange={update(key)} className="input-premium mt-1.5" /></label>;
  }
  const strength = [form.password.length >= 10, /[A-Za-z]/.test(form.password) && /\d/.test(form.password), /[^A-Za-z0-9]/.test(form.password), form.password.length >= 14].filter(Boolean).length;
  return <main className="min-h-screen flex font-body bg-[var(--bg-surface)] text-[var(--text-primary)]">
    <section className="flex-1 px-5 sm:px-10 lg:px-14 py-10 lg:py-12">
      <div className="w-full max-w-xl mx-auto">
        <Link to="/" className="inline-block mb-8"><img src="/zapai-logo-dark.png" alt="ZapAI" className="h-12 dark:hidden"/><img src="/zapai-logo-light.png" alt="ZapAI" className="h-12 hidden dark:block"/></Link>
        <h1 className="text-3xl font-black tracking-tight">{sent ? "Confira seu e-mail" : google ? "Complete seu cadastro" : "Crie sua conta"}</h1>
        <p className="text-[var(--text-secondary)] mt-2 mb-6 text-sm">{sent ? "Falta só confirmar que esse e-mail é seu." : "Seu atendimento inteligente começa aqui. Sem cartão de crédito."}</p>
        {error && <div role="alert" className="p-4 mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-sm">{error}</div>}
        {notice && <p role="status" className="text-sm text-teal-600 mb-4">{notice}</p>}
        {sent ? <div className="space-y-5"><MailCheck size={48} className="text-teal-500"/><p className="text-[var(--text-secondary)]">Enviamos as instruções para <strong className="text-[var(--text-primary)] break-all">{form.email}</strong>. Abra o link de confirmação para ativar sua conta. Confira também o spam.</p><button type="button" onClick={resend} disabled={loading || cooldown > 0} className="btn-primary w-full">{cooldown > 0 ? `Reenviar em ${cooldown}s` : loading ? "Enviando…" : "Reenviar confirmação"}</button><Link to="/login" className="btn-outline w-full flex justify-center">Ir para o login</Link></div> : <>
          {step === 1 && !google && <><button type="button" disabled={loading} onClick={startGoogle} className="btn-outline w-full flex items-center justify-center gap-3 h-12"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.2H12v4.2h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 14.1a6 6 0 0 1 0-4.2V7.3H3a10 10 0 0 0 0 9.4l3.4-2.6Z"/><path fill="#EA4335" d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.3l3.4 2.6C7.2 7.6 9.4 5.8 12 5.8Z"/></svg>{loading ? "Conectando…" : "Criar conta com Google / Gmail"}</button><div className="flex items-center gap-4 my-6 text-xs text-[var(--text-muted)]"><span className="h-px bg-[var(--border-subtle)] flex-1"/>ou cadastre-se com e-mail<span className="h-px bg-[var(--border-subtle)] flex-1"/></div></>}
          <ol aria-label="Etapas do cadastro" className="flex gap-2 mb-7">{["Seus dados","Endereço","Seu negócio"].map((label,i) => <li key={label} aria-current={step === i+1 ? "step" : undefined} className={`flex-1 text-xs border-b-2 pb-3 ${step >= i+1 ? "border-teal-500 text-teal-600" : "border-[var(--border-subtle)] text-[var(--text-muted)]"}`}><span className="font-bold">{i+1}.</span> {label}</li>)}</ol>
          <form onSubmit={submit} className="space-y-5">
            <fieldset disabled={loading} className="space-y-5"><legend className="sr-only">{["Seus dados pessoais","Seu endereço","Seu negócio"][step-1]}</legend>
              {step === 1 && <>{field("nome","Nome completo","text","name","João da Silva")}<div className="grid sm:grid-cols-2 gap-4">{field("cpf","CPF","text",undefined,"000.000.000-00")}{field("birthDate","Data de nascimento","date","bday")}</div>{field("phone","Celular / WhatsApp com DDD","tel","tel-national","(11) 99999-9999")}{field("email","E-mail de acesso","email","email","voce@gmail.com")}<p className="text-xs text-[var(--text-muted)]">{google ? "E-mail confirmado. Complete os dados para continuar." : "Pode ser Gmail ou outro provedor. Enviaremos um link de confirmação."}</p>{!google && <><div className="relative">{field("password","Crie sua senha",show ? "text" : "password","new-password","10 ou mais caracteres")}<button type="button" aria-label={show ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShow(!show)} className="absolute right-3 top-10 bg-[var(--bg-surface)] p-1">{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div><div className="flex gap-1" aria-label={`Força da senha: ${strength} de 4`}>{[1,2,3,4].map(n => <span key={n} className={`h-1 rounded flex-1 ${strength >= n ? "bg-teal-500" : "bg-slate-200"}`}/>)}</div><p className="text-xs text-[var(--text-muted)]">No mínimo 10 caracteres, com letras e números. Use símbolos para reforçar.</p>{field("confirmPassword","Confirme sua senha",show ? "text" : "password","new-password")}</>}</>}
              {step === 2 && <><div className="grid sm:grid-cols-2 gap-4">{field("cep","CEP","text","postal-code","00000-000")}{field("number","Número","text",undefined,"123 ou S/N")}</div>{field("street","Rua / Avenida","text","address-line1")}{field("complement","Complemento","text","address-line2", "Apartamento, sala…",true)}{field("district","Bairro","text","address-level3")}<div className="grid grid-cols-[1fr_90px] gap-4">{field("city","Cidade","text","address-level2")}<label className="text-sm font-semibold">UF<select id="reg-state" required value={form.state} onChange={update("state")} className="input-premium mt-1.5"><option value="">UF</option>{STATES.map(s => <option key={s}>{s}</option>)}</select></label></div></>}
              {step === 3 && <>{field("businessName","Nome da empresa / negócio","text","organization","Como seus clientes conhecem seu negócio")}<label className="block text-sm font-semibold">Segmento<select id="reg-nicho" required value={form.nicho} onChange={update("nicho")} className="input-premium mt-1.5"><option value="">Selecione seu segmento</option>{Object.entries(SEGMENTS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label><div className="rounded-xl p-4 bg-teal-500/10 text-sm space-y-2"><p className="font-bold flex gap-2 items-center"><ShieldCheck size={18}/>Revise antes de confirmar</p><p>{form.nome} · {form.email}</p><p>{form.city} / {form.state}</p><p>Seus dados são utilizados para identificação e gestão da conta. Não coletamos cartão de crédito.</p></div><label className="flex gap-3 text-sm items-start"><input type="checkbox" required checked={form.acceptPrivacy} onChange={e => setForm(f => ({ ...f, acceptPrivacy:e.target.checked }))} className="mt-1 accent-teal-600"/><span>Li e aceito a <Link to="/privacidade" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">Política de Privacidade</Link> e estou ciente do uso dos dados para criar e administrar minha conta.</span></label></>}
            </fieldset>
            <div className="flex gap-3">{step > 1 && <button type="button" disabled={loading} onClick={() => { setStep(step-1); setError(""); }} className="btn-outline px-6">Voltar</button>}<button type="submit" disabled={loading} className="btn-primary flex-1 h-12 flex items-center justify-center gap-2">{loading ? "Criando sua conta…" : step < 3 ? "Continuar" : google ? "Concluir e acessar" : "Criar conta e confirmar e-mail"}{!loading && <ArrowRight size={17}/>}</button></div>
          </form>
          {!google && <details className="mt-5 text-sm text-[var(--text-secondary)]"><summary className="cursor-pointer">Já se cadastrou e precisa de outro link?</summary><div className="space-y-3 mt-3">{field("email","E-mail cadastrado","email","email")}<button type="button" disabled={loading || cooldown > 0} onClick={resend} className="btn-outline w-full">{cooldown ? `Reenviar em ${cooldown}s` : "Reenviar confirmação"}</button></div></details>}
        </>}
        <p className="mt-7 text-center text-sm text-[var(--text-secondary)]">Já possui uma conta? <Link to="/login" className="text-teal-600 font-bold">Fazer login</Link></p>
      </div>
    </section>
    <aside className="hidden lg:flex w-[40%] bg-slate-900 text-white p-14 items-center sticky top-0 h-screen"><div className="max-w-md"><span className="inline-flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-6"><ShieldCheck size={18}/>Sua nova conta ZapAI</span><h2 className="text-4xl font-black leading-tight">Um cadastro completo.<br/><span className="text-cyan-400">Um começo seguro.</span></h2><p className="text-slate-400 mt-5 leading-relaxed">Organize o atendimento do seu negócio em um só lugar e prepare sua operação para crescer.</p><div className="space-y-5 mt-10">{["Crie sua conta com Google ou e-mail","Confirme sua identidade e complete seus dados","Configure seu atendimento no painel"].map(s => <div key={s} className="flex items-start gap-3"><span className="rounded-full p-1 bg-cyan-400/10 text-cyan-400"><Check size={18}/></span><p className="text-sm text-slate-200">{s}</p></div>)}</div><p className="text-xs text-slate-500 mt-12">Sem cartão de crédito para começar.</p></div></aside>
  </main>;
}
