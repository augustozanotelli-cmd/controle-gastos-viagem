import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowDownLeft, ArrowUpRight, Banknote, Check, Clock3, LoaderCircle, Trash2, Wallet } from "lucide-react";
import { PESSOAS } from "./config";
import { supabase, supabaseConfigurado } from "./lib/supabase";

type Tipo = "entrada" | "gasto";
type Lancamento = {
  id: string;
  pessoa: string;
  tipo: Tipo;
  valor: number;
  descricao: string | null;
  criado_em: string;
};

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dataHora = (valor: string) =>
  new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function App() {
  const [pessoa, setPessoa] = useState(PESSOAS[0] ?? "");
  const [tipo, setTipo] = useState<Tipo>("gasto");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [filtroPessoa, setFiltroPessoa] = useState("todas");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregar = useCallback(async () => {
    if (!supabase) {
      setErro("Configure as variáveis do Supabase no arquivo .env.local para carregar os dados.");
      setCarregando(false);
      return;
    }
    setCarregando(true);
    const { data, error } = await supabase
      .from("lancamentos")
      .select("id, pessoa, tipo, valor, descricao, criado_em")
      .order("criado_em", { ascending: false })
      .limit(200);

    if (error) setErro(`Não foi possível carregar os lançamentos: ${error.message}`);
    else {
      setLancamentos((data ?? []) as Lancamento[]);
      setErro("");
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const lancamentosFiltrados = useMemo(
    () => filtroPessoa === "todas"
      ? lancamentos
      : lancamentos.filter((item) => item.pessoa === filtroPessoa),
    [lancamentos, filtroPessoa],
  );

  const totais = useMemo(() => {
    const entradas = lancamentos
      .filter((item) => item.tipo === "entrada")
      .reduce((soma, item) => soma + Number(item.valor), 0);
    const gastos = lancamentos
      .filter((item) => item.tipo === "gasto")
      .reduce((soma, item) => soma + Number(item.valor), 0);
    return { entradas, gastos, saldo: entradas - gastos };
  }, [lancamentos]);

  async function adicionar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    const valorNumerico = Number(valor.replace(",", "."));
    if (!pessoa) {
      setErro("Adicione pelo menos uma pessoa em src/config.ts.");
      return;
    }
    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setErro("Digite um valor maior que R$ 0,00.");
      return;
    }
    if (!supabase) {
      setErro("Configure o Supabase antes de salvar lançamentos.");
      return;
    }

    setSalvando(true);
    const { error } = await supabase.from("lancamentos").insert({
      pessoa,
      tipo,
      valor: Math.round(valorNumerico * 100) / 100,
      descricao: descricao.trim() || null,
    });

    if (error) setErro(`Não foi possível salvar: ${error.message}`);
    else {
      setValor("");
      setDescricao("");
      setSucesso(tipo === "entrada" ? "Entrada registrada com sucesso." : "Gasto registrado com sucesso.");
      await carregar();
    }
    setSalvando(false);
  }

  async function excluir(item: Lancamento) {
    if (!supabase) return;
    const confirmado = window.confirm(`Excluir o lançamento de ${moeda(Number(item.valor))} de ${item.pessoa}?`);
    if (!confirmado) return;
    setErro("");
    const { error } = await supabase.from("lancamentos").delete().eq("id", item.id);
    if (error) setErro(`Não foi possível excluir: ${error.message}`);
    else {
      setSucesso("Lançamento excluído.");
      await carregar();
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand-mark"><Wallet size={22} strokeWidth={2.2} /></div>
        <div>
          <p className="eyebrow">CONTROLE DA EQUIPE</p>
          <h1>Caixa da viagem</h1>
        </div>
        <div className="live-pill"><span /> Caixa compartilhado</div>
      </header>

      <div className="content-grid">
        <section className="panel form-panel">
          <div className="section-heading">
            <div className="heading-icon"><ArrowDownLeft size={19} /></div>
            <div><h3>Novo lançamento</h3><p>Preencha os dados abaixo</p></div>
          </div>

          <form onSubmit={adicionar}>
            <label htmlFor="pessoa">Pessoa</label>
            <select id="pessoa" value={pessoa} onChange={(e) => setPessoa(e.target.value)} required>
              {PESSOAS.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
            </select>

            <label>Tipo de movimentação</label>
            <div className="type-switch">
              <button type="button" className={tipo === "gasto" ? "type-option selected expense" : "type-option"} onClick={() => setTipo("gasto")} aria-pressed={tipo === "gasto"}>
                <ArrowUpRight size={18} /> Gasto
              </button>
              <button type="button" className={tipo === "entrada" ? "type-option selected income" : "type-option"} onClick={() => setTipo("entrada")} aria-pressed={tipo === "entrada"}>
                <ArrowDownLeft size={18} /> Entrada
              </button>
            </div>

            <label htmlFor="valor">Valor (R$)</label>
            <div className="money-input">
              <span>R$</span>
              <input id="valor" inputMode="decimal" type="text" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} required />
            </div>

            <label htmlFor="descricao">Descrição <span className="optional">(opcional)</span></label>
            <input id="descricao" type="text" maxLength={120} placeholder="Ex.: mercado, combustível..." value={descricao} onChange={(e) => setDescricao(e.target.value)} />

            <button className="submit-button" type="submit" disabled={salvando || !supabaseConfigurado}>
              {salvando ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />}
              {salvando ? "Salvando..." : "Registrar lançamento"}
            </button>
            {!supabaseConfigurado && <p className="hint">Finalize a configuração do Supabase para habilitar os registros.</p>}
          </form>
          {erro && <div className="notice error" role="alert">{erro}</div>}
          {sucesso && <div className="notice success" role="status">{sucesso}</div>}
        </section>

        <section className="panel history-panel">
          <div className="section-heading history-heading">
            <div className="heading-icon history-icon"><Clock3 size={19} /></div>
            <div><h3>Últimos lançamentos</h3><p>Movimentações mais recentes</p></div>
            <button className="refresh-button" type="button" onClick={() => void carregar()} aria-label="Atualizar lançamentos" title="Atualizar"><LoaderCircle size={17} /></button>
          </div>

          <div className="history-filter">
            <label htmlFor="filtro-pessoa">Filtrar por pessoa</label>
            <select
              id="filtro-pessoa"
              value={filtroPessoa}
              onChange={(e) => setFiltroPessoa(e.target.value)}
            >
              <option value="todas">Todas as pessoas</option>
              {PESSOAS.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
            </select>
          </div>

          {carregando ? (
            <div className="empty-state"><LoaderCircle className="spin" size={24} /><p>Carregando lançamentos...</p></div>
          ) : lancamentosFiltrados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Banknote size={24} /></div>
              <strong>{filtroPessoa === "todas" ? "Nenhum lançamento ainda" : "Nenhum lançamento para esta pessoa"}</strong>
              <p>{filtroPessoa === "todas" ? "Quando você registrar uma entrada ou gasto, ele aparecerá aqui." : "Selecione outra pessoa ou escolha “Todas as pessoas” para ver outros lançamentos."}</p>
            </div>
          ) : (
            <div className="transactions">
              {lancamentosFiltrados.map((item) => (
                <article className="transaction" key={item.id}>
                  <div className={`transaction-icon ${item.tipo}`}>
                    {item.tipo === "entrada" ? <ArrowDownLeft size={19} /> : <ArrowUpRight size={19} />}
                  </div>
                  <div className="transaction-main">
                    <strong>{item.pessoa}</strong>
                    <span>{item.descricao || (item.tipo === "entrada" ? "Contribuição para o caixa" : "Gasto da viagem")}</span>
                    <small>{dataHora(item.criado_em)}</small>
                  </div>
                  <div className="transaction-end">
                    <strong className={item.tipo}>{item.tipo === "entrada" ? "+" : "−"}{moeda(Number(item.valor))}</strong>
                    <button type="button" className="delete-button" onClick={() => void excluir(item)} aria-label={`Excluir lançamento de ${item.pessoa}`} title="Excluir"><Trash2 size={15} /></button>
                  </div>
                </article>
              ))}
              {lancamentos.length >= 200 && filtroPessoa === "todas" && <p className="hint">Mostrando os 200 lançamentos mais recentes.</p>}
            </div>
          )}
        </section>
      </div>

      <footer className="summary">
        <div className="summary-title"><span className="summary-dot" /> RESUMO DO CAIXA</div>
        <div className="summary-grid">
          <div className="summary-item"><span className="summary-label"><ArrowDownLeft size={15} /> Total de entradas</span><strong className="income">{moeda(totais.entradas)}</strong></div>
          <div className="summary-item"><span className="summary-label"><ArrowUpRight size={15} /> Total de gastos</span><strong className="expense-text">{moeda(totais.gastos)}</strong></div>
          <div className="summary-item balance"><span className="summary-label"><Wallet size={15} /> Saldo do caixa</span><strong className={totais.saldo < 0 ? "negative" : ""}>{moeda(totais.saldo)}</strong></div>
        </div>
        <p className="footer-note">Os totais consideram todos os lançamentos registrados.</p>
      </footer>
      <p className="copyright">CAIXA DA VIAGEM <span>·</span> CONTROLE SIMPLES, SEM COMPLICAÇÃO</p>
    </main>
  );
}
