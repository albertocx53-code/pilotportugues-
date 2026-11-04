'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Marca } from '@/components/brand/logo';
import { Icone } from '@/components/shell/icone';
import { MODULOS } from '@/lib/modules';
import { useAviso } from '@/components/ui/toast';

const ETAPAS = [
  { id: 'fundamental1', nome: 'Fundamental I', detalhe: '1º ao 5º ano' },
  { id: 'fundamental2', nome: 'Fundamental II', detalhe: '6º ao 9º ano' },
  { id: 'medio', nome: 'Ensino Médio', detalhe: '1ª à 3ª série' },
  { id: 'eja', nome: 'EJA', detalhe: 'Jovens e adultos' },
  { id: 'superior', nome: 'Superior', detalhe: 'Graduação e cursinho' },
  { id: 'outro', nome: 'Outro', detalhe: 'Reforço, particular' },
];

const ANOS = [
  '1º ano',
  '2º ano',
  '3º ano',
  '4º ano',
  '5º ano',
  '6º ano',
  '7º ano',
  '8º ano',
  '9º ano',
  '1ª série EM',
  '2ª série EM',
  '3ª série EM',
];

export default function Onboarding() {
  const [passo, setPasso] = useState(0);
  const [nome, setNome] = useState('');
  const [escola, setEscola] = useState('');
  const [cidade, setCidade] = useState('');
  const [etapa, setEtapa] = useState('fundamental2');
  const [anos, setAnos] = useState<string[]>([]);
  const [ocupado, setOcupado] = useState(false);

  const router = useRouter();
  const { avisar } = useAviso();

  function alternarAno(ano: string) {
    setAnos((atual) =>
      atual.includes(ano) ? atual.filter((a) => a !== ano) : [...atual, ano],
    );
  }

  async function concluir(destino: string) {
    setOcupado(true);
    const db = supabaseBrowser();
    const {
      data: { user },
    } = await db.auth.getUser();

    if (!user) {
      router.replace('/login');
      return;
    }

    const { error } = await db
      .from('profiles')
      .update({
        full_name: nome.trim().slice(0, 120),
        school: escola.trim().slice(0, 160),
        city: cidade.trim().slice(0, 120),
        stage: etapa,
        grades: anos.slice(0, 12),
        onboarded: true,
      })
      .eq('id', user.id);

    if (error) {
      avisar('Não foi possível salvar seus dados. Tente novamente.', 'erro');
      setOcupado(false);
      return;
    }

    router.replace(destino);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-papel-2 px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <Marca tamanho="lg" />

        {/* Progresso */}
        <div className="mt-8 flex gap-1.5" role="presentation">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= passo ? 'bg-pena' : 'bg-papel-3'
              }`}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-grafite">Passo {passo + 1} de 3</p>

        <div key={passo} className="surgir folha mt-5 p-7 sm:p-8">
          {passo === 0 && (
            <>
              <h1 className="text-2xl font-bold">Vamos começar pelo básico</h1>
              <p className="mt-2 text-sm leading-relaxed text-grafite">
                Seu nome aparece nos materiais que você exportar. O resto é opcional e
                serve para o sistema sugerir conteúdos mais próximos da sua realidade.
              </p>

              <div className="mt-7 space-y-5">
                <label className="block text-sm font-medium">
                  Seu nome
                  <input
                    className="campo mt-1.5"
                    maxLength={120}
                    autoFocus
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Maria Souza"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Escola <span className="font-normal text-grafite-2">(opcional)</span>
                  <input
                    className="campo mt-1.5"
                    maxLength={160}
                    value={escola}
                    onChange={(e) => setEscola(e.target.value)}
                    placeholder="E.E. Monteiro Lobato"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Cidade <span className="font-normal text-grafite-2">(opcional)</span>
                  <input
                    className="campo mt-1.5"
                    maxLength={120}
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Belo Horizonte"
                  />
                </label>
              </div>

              <button
                className="botao mt-7 w-full"
                disabled={!nome.trim()}
                onClick={() => setPasso(1)}
              >
                Continuar
              </button>
            </>
          )}

          {passo === 1 && (
            <>
              <h1 className="text-2xl font-bold">Com quem você trabalha?</h1>
              <p className="mt-2 text-sm leading-relaxed text-grafite">
                Isso define o nível de linguagem que a IA usa por padrão. Você pode mudar
                em cada material.
              </p>

              <fieldset className="mt-7">
                <legend className="text-sm font-medium">Etapa principal</legend>
                <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                  {ETAPAS.map((e) => (
                    <label
                      key={e.id}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-colors ${
                        etapa === e.id
                          ? 'border-pena bg-pena-clara'
                          : 'border-linha bg-papel hover:border-grafite-2'
                      }`}
                    >
                      <input
                        type="radio"
                        name="etapa"
                        className="sr-only"
                        checked={etapa === e.id}
                        onChange={() => setEtapa(e.id)}
                      />
                      <span className="block text-sm font-semibold">{e.nome}</span>
                      <span className="mt-0.5 block text-xs text-grafite">{e.detalhe}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-7">
                <legend className="text-sm font-medium">
                  Anos que você leciona{' '}
                  <span className="font-normal text-grafite-2">(opcional)</span>
                </legend>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {ANOS.map((ano) => {
                    const ativo = anos.includes(ano);
                    return (
                      <button
                        key={ano}
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => alternarAno(ano)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                          ativo
                            ? 'border-pena bg-pena text-white dark:text-[#0c1120]'
                            : 'border-linha bg-papel text-tinta-2 hover:border-grafite-2'
                        }`}
                      >
                        {ano}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-7 flex gap-3">
                <button className="botao-vazio" onClick={() => setPasso(0)}>
                  <ArrowLeft size={16} aria-hidden />
                  Voltar
                </button>
                <button className="botao flex-1" onClick={() => setPasso(2)}>
                  Continuar
                </button>
              </div>
            </>
          )}

          {passo === 2 && (
            <>
              <h1 className="text-2xl font-bold">
                Tudo pronto, {nome.trim().split(/\s+/)[0] || 'professor'}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-grafite">
                Por onde você quer começar? Dá para trocar de módulo a qualquer momento.
              </p>

              <ul className="mt-6 space-y-2">
                {MODULOS.filter((m) => m.destaque)
                  .slice(0, 4)
                  .map((m) => (
                    <li key={m.tipo}>
                      <button
                        disabled={ocupado}
                        onClick={() => concluir(m.rota)}
                        className="flex w-full items-center gap-3.5 rounded-xl border border-linha bg-papel p-3.5 text-left transition-colors hover:border-pena disabled:opacity-60"
                      >
                        <span className="text-pena">
                          <Icone nome={m.icone} size={20} />
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-semibold">{m.nome}</span>
                          <span className="mt-0.5 block text-xs text-grafite">
                            {m.resumo}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>

              <div className="mt-6 flex gap-3">
                <button
                  className="botao-vazio"
                  disabled={ocupado}
                  onClick={() => setPasso(1)}
                >
                  <ArrowLeft size={16} aria-hidden />
                  Voltar
                </button>
                <button
                  className="botao flex-1"
                  disabled={ocupado}
                  onClick={() => concluir('/dashboard')}
                >
                  {ocupado && <Loader2 size={17} className="girando" aria-hidden />}
                  {ocupado ? 'Salvando...' : 'Ir para o painel'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
