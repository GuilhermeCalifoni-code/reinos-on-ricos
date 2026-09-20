export const SUPABASE_SQL_QUERY = `-- ============================================================
-- REINOS ONÍRICOS RPG - ESTRUTURA COMPLETA SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================================

-- 1. Extensão para identificadores UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuário (Mestre ou Jogador)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('mestre', 'jogador')) DEFAULT 'jogador',
  avatar_url TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Mesas / Campanhas de RPG
CREATE TABLE IF NOT EXISTS public.mesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT UNIQUE NOT NULL, -- Ex: "REINO-77" ou "NEVOA-01"
  nome TEXT NOT NULL DEFAULT 'Crônica Urbana',
  descricao TEXT DEFAULT 'Fronteiras entre a Vigília e o Sonhar.',
  senha_mestre TEXT NOT NULL DEFAULT 'mestre123',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Inserir uma mesa padrão inicial caso não exista
INSERT INTO public.mesas (codigo, nome, descricao, senha_mestre)
VALUES ('ONIRICO-01', 'Campanha Principal: O Despertar da Névoa', 'Mesa padrão para testes e sessões.', 'mestre123')
ON CONFLICT (codigo) DO NOTHING;

-- 5. Tabela de Personagens (Desvelados)
CREATE TABLE IF NOT EXISTS public.personagens (
  id TEXT PRIMARY KEY,
  mesa_codigo TEXT DEFAULT 'ONIRICO-01',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  jogador TEXT NOT NULL DEFAULT 'Jogador',
  conceito TEXT NOT NULL DEFAULT 'Lúcido',
  nivel INT NOT NULL DEFAULT 1,
  atributos JSONB NOT NULL DEFAULT '{"corpo":1,"mente":2,"vontade":1,"vinculo":0}'::jsonb,
  atributo_principal TEXT NOT NULL DEFAULT 'mente',
  resistencia INT NOT NULL DEFAULT 7,
  defesa INT NOT NULL DEFAULT 10,
  vida_atual INT NOT NULL DEFAULT 3,
  vida_maxima INT NOT NULL DEFAULT 3,
  foco_atual INT NOT NULL DEFAULT 4,
  foco_maximo INT NOT NULL DEFAULT 4,
  protecao_onirica_atual INT NOT NULL DEFAULT 2,
  protecao_onirica_maxima INT NOT NULL DEFAULT 2,
  ruptura INT NOT NULL DEFAULT 0,
  historico_ruptura JSONB NOT NULL DEFAULT '[]'::jsonb,
  dominios JSONB NOT NULL DEFAULT '{"consciencia":2,"espaco":1,"fluxo":0,"substancia":0,"vida":0}'::jsonb,
  ancoragem TEXT NOT NULL DEFAULT '',
  vinculos JSONB NOT NULL DEFAULT '[]'::jsonb,
  equipamentos JSONB NOT NULL DEFAULT '[]'::jsonb,
  recursos JSONB NOT NULL DEFAULT '[]'::jsonb,
  percepcao_onirica_notas TEXT DEFAULT '',
  anotacoes_gerais TEXT DEFAULT '',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Cenas de Tensão (Gerenciadas pelo Mestre)
CREATE TABLE IF NOT EXISTS public.cenas_tensao (
  id TEXT PRIMARY KEY DEFAULT 'cena-ativa',
  mesa_codigo TEXT DEFAULT 'ONIRICO-01',
  titulo TEXT NOT NULL DEFAULT 'Cena de Tensão',
  descricao TEXT DEFAULT '',
  rodada_atual INT NOT NULL DEFAULT 1,
  em_andamento BOOLEAN NOT NULL DEFAULT TRUE,
  oponentes JSONB NOT NULL DEFAULT '[]'::jsonb,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Rolagens em Tempo Real (Feed da Sessão)
CREATE TABLE IF NOT EXISTS public.rolagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mesa_codigo TEXT DEFAULT 'ONIRICO-01',
  autor_nome TEXT NOT NULL,
  autor_role TEXT DEFAULT 'jogador',
  tipo_teste TEXT NOT NULL, -- 'mundano', 'onirico', 'morte'
  dados_rolados JSONB NOT NULL,
  resultado TEXT NOT NULL,
  sucesso BOOLEAN,
  delta_ruptura INT DEFAULT 0,
  detalhes TEXT DEFAULT '',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Ativar Segurança de Linhas (Row Level Security - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cenas_tensao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rolagens ENABLE ROW LEVEL SECURITY;

-- 9. Políticas Abertas para Mesas de RPG (permitir leitura e escrita por token anon)
CREATE POLICY "Permitir tudo em mesas" ON public.mesas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo em perfis" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo em personagens" ON public.personagens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo em cenas_tensao" ON public.cenas_tensao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo em rolagens" ON public.rolagens FOR ALL USING (true) WITH CHECK (true);

-- 10. Habilitar Replicação em Tempo Real (Supabase Realtime)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.personagens, 
    public.cenas_tensao, 
    public.rolagens;
COMMIT;
`;
