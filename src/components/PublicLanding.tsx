import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Compass, Layers3, LockKeyhole, Menu, MoonStar, ScrollText, Shield, ShoppingBag, Sparkles, Users, X } from 'lucide-react';

export type PublicScreen = 'landing' | 'store';
export type BookSelection = 'combo' | 'basico' | 'adversarios';

type Props = {
  screen: PublicScreen;
  selection: BookSelection;
  onScreenChange: (screen: PublicScreen, selection?: BookSelection) => void;
  onEnter: () => void;
  onRegister: () => void;
};

const works = [
  { id:'basico' as const, tag:'LIVRO 01 · A PORTA DE ENTRADA', title:'Livro Básico', subtitle:'Tudo começa com uma fissura na Realidade.',
    description:'Regras, criação de Desvelados, Domínios do Sonhar, equipamentos, desafios, ambientação e ferramentas para começar a jogar.',pages:'180 páginas',media:'ro-public-book--basico' },
  { id:'adversarios' as const, tag:'LIVRO 02 · O OUTRO LADO', title:'Livro de Adversários', subtitle:'Dê um rosto aos seus pesadelos.',
    description:'Exemplos e construção de adversários: Humanos, Desvelados, Dissonantes e criaturas oníricas organizados por Nível de Ameaça.',pages:'56 páginas',media:'ro-public-book--adversarios' }
];

function BrandedBook({ variant, large = false }: {variant:'basico'|'adversarios',large?:boolean}) {
  const isBasic=variant==='basico';
  return <div className={`ro-public-book ${isBasic?'ro-public-book--basico':'ro-public-book--adversarios'} ${large?'is-large':''}`} aria-label={isBasic?'Representação editorial do Livro Básico':'Representação editorial do Livro de Adversários'}>
    <div className="ro-public-book__face">
      <img src="/ro-login-logo.webp" alt="Reinos Oníricos RPG" className="ro-public-book__brand"/>
      <div className="ro-public-book__art" aria-hidden="true"><img src={isBasic?'/ro-login-portrait.webp':'/compendium/compendium-rupture.webp'} alt=""/></div>
      <div className="ro-public-book__label"><span>{isBasic?'LIVRO BÁSICO':'LIVRO DE ADVERSÁRIOS'}</span><small>DIOGO ZORNOFF</small></div>
    </div>
  </div>;
}

function Signature({dark=false}:{dark?:boolean}) {
  return <div className={`ro-public-signature ${dark?'is-dark':''}`}>
    <img src="/ro-login-logo.webp" alt="Reinos Oníricos RPG"/>
  </div>;
}

function BookChoices({selection,onSelect}:{selection:BookSelection,onSelect:(s:BookSelection)=>void}) {
  const items:[BookSelection,string,string][]=[
    ['combo','Coleção completa','Livro Básico + Livro de Adversários'],
    ['basico','Livro Básico','Regras e universo para começar'],
    ['adversarios','Livro de Adversários','Ameaças, exemplos e desafios']
  ];
  return <div className="ro-public-choices" role="radiogroup" aria-label="Edição digital">
    {items.map(([id,title,subtitle])=><button type="button" role="radio" aria-checked={selection===id} className={`ro-public-choice ${selection===id?'is-active':''}`} key={id} onClick={()=>onSelect(id)}>
      <span className="ro-public-choice__dot" aria-hidden="true"/><span><strong>{title}</strong><small>{subtitle}</small></span>{id==='combo'&&<em>DOIS LIVROS</em>}
    </button>)}
  </div>;
}

export const PublicLanding:React.FC<Props>=({screen,selection,onScreenChange,onEnter,onRegister})=>{
  const [menuOpen,setMenuOpen]=useState(false);
  const [chosen,setChosen]=useState<BookSelection>(selection);
  useEffect(()=>{setChosen(selection)},[selection]);
  useEffect(()=>{if(screen==='store'){window.scrollTo({top:0,behavior:'instant'});}},[screen]);
  const shop=(choice:BookSelection='combo')=>{setMenuOpen(false);setChosen(choice);onScreenChange('store',choice);};
  const home=()=>onScreenChange('landing');
  const logo=<Signature/>;

  if(screen==='store')return <div className="ro-public ro-public--store">
    <header className="ro-public-header ro-public-header--store">
      <button type="button" className="ro-public-header__logo" onClick={home} aria-label="Voltar à apresentação">{logo}</button>
      <nav className="ro-public-header__desktop"><button onClick={home} type="button">O projeto</button><span className="ro-public-header__sep">/</span><strong>Livros digitais</strong></nav>
      <button className="ro-public-header__login" onClick={onEnter} type="button">Entrar <ArrowRight size={15}/></button>
    </header>
    <main className="ro-public-store">
      <button className="ro-public-back" type="button" onClick={home}><ArrowLeft size={16}/> Voltar ao site</button>
      <div className="ro-public-store__intro"><span className="ro-public-eyebrow">BIBLIOTECA DIGITAL · PRÉVIA DE COMPRA</span><h1>Seu próximo universo <em>começa aqui.</em></h1><p>Escolha um dos volumes ou leve a coleção Reinos Oníricos. As compras ainda não estão abertas: esta tela mostra como será a experiência.</p></div>
      <div className="ro-public-store__grid">
        <div className="ro-public-store__products">
          {works.map(work=><article className="ro-public-store__product" key={work.id}>
            <div className="ro-public-store__cover"><BrandedBook variant={work.id}/></div>
            <div><span className="ro-public-eyebrow">{work.tag}</span><h2>{work.title}</h2><p>{work.description}</p><small>{work.pages} · Edição digital em PDF</small></div>
          </article>)}
        </div>
        <aside className="ro-public-checkout" aria-label="Resumo da seleção">
          <div className="ro-public-checkout__head"><ShoppingBag size={19}/><span>SEU PEDIDO</span></div>
          <h2>Escolha sua <em>edição.</em></h2>
          <BookChoices selection={chosen} onSelect={setChosen}/>
          <div className="ro-public-checkout__summary">
            <span>{chosen==='combo'?'Coleção completa':chosen==='basico'?'Livro Básico':'Livro de Adversários'}</span>
            <span>Preço a definir</span>
          </div>
          <div className="ro-public-checkout__includes">
            <p><Check size={16}/> Formato digital (PDF)</p>
            <p><Check size={16}/> Material oficial de Reinos Oníricos RPG</p>
            {chosen==='combo'&&<p><Check size={16}/> Os dois volumes na mesma coleção</p>}
          </div>
          <button type="button" disabled className="ro-public-button ro-public-button--solid ro-public-checkout__disabled"><LockKeyhole size={17}/> Compra indisponível no momento</button>
          <p className="ro-public-checkout__notice" role="status">Sem pagamentos, preços ou coleta de dados nesta prévia. O checkout será conectado somente depois de definirmos a venda dos PDFs.</p>
        </aside>
      </div>
    </main>
    <footer className="ro-public-footer"><Signature/><span>© 2026 Reinos Oníricos RPG · Protótipo não publicado</span><button onClick={home} type="button">Voltar ao início ↑</button></footer>
  </div>;

  return <div className="ro-public">
    <div className="ro-public-preview-strip">APRESENTAÇÃO DO PROJETO · PRÉVIA DE REVISÃO · COMPRAS NÃO HABILITADAS</div>
    <header className="ro-public-header">
      <a className="ro-public-header__logo" href="#inicio" aria-label="Reinos Oníricos, voltar ao início">{logo}</a>
      <nav className="ro-public-header__desktop" aria-label="Navegação principal">
        <a href="#universo">O universo</a><a href="#plataforma">A plataforma</a><a href="#livros">Os livros</a><a href="#comunidade">Comunidade</a><a href="#autores">Os criadores</a>
      </nav>
      <div className="ro-public-header__actions"><button className="ro-public-header__login" type="button" onClick={onEnter}>Entrar <ArrowRight size={15}/></button>
      <button className="ro-public-menu-toggle" aria-label={menuOpen?'Fechar menu':'Abrir menu'} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)} type="button">{menuOpen?<X/>:<Menu/>}</button></div>
    </header>
    {menuOpen&&<nav className="ro-public-mobile-menu" aria-label="Menu mobile">{[['#universo','O universo'],['#plataforma','A plataforma'],['#livros','Os livros'],['#comunidade','Comunidade'],['#autores','Os criadores']].map(([href,label])=><a key={href} href={href} onClick={()=>setMenuOpen(false)}>{label}<ArrowRight size={16}/></a>)}<button type="button" onClick={onRegister}>Criar conta <ArrowRight size={16}/></button></nav>}
    <main>
      <section className="ro-public-hero" id="inicio">
        <div className="ro-public-hero__copy">
          <span className="ro-public-eyebrow">UMA HISTÓRIA ENTRE A REALIDADE E O SONHAR</span>
          <h1>O impossível está <em>mais perto do que parece.</em></h1>
          <p>Reinos Oníricos é um RPG brasileiro de fantasia urbana e horror onírico. Descubra o universo de Diogo Zornoff e uma plataforma digital criada para dar vida às suas histórias.</p>
          <div className="ro-public-hero__actions"><a className="ro-public-button ro-public-button--solid" href="#universo">Conhecer o RPG <ArrowRight size={18}/></a><button type="button" onClick={()=>shop('combo')} className="ro-public-button ro-public-button--outline">Conhecer os livros <BookOpen size={17}/></button></div>
          <a className="ro-public-hero__scroll" href="#universo">DESCUBRA O QUE EXISTE ALÉM <ArrowDown size={15}/></a>
        </div>
        <div className="ro-public-hero__visual"><div className="ro-public-hero__wash"/><BrandedBook variant="basico" large/><span className="ro-public-hero__visual-label">UMA OBRA DE DIOGO ZORNOFF <span>·</span> 2026</span></div>
      </section>
      <section className="ro-public-universe" id="universo">
        <div className="ro-public-section-heading"><span className="ro-public-eyebrow">01 · O UNIVERSO</span><h2>A realidade é só <em>o começo.</em></h2></div>
        <div className="ro-public-universe__grid"><div className="ro-public-universe__image"><img src="/ro-login-mist-city.webp" alt="Cidade onírica, arte oficial da plataforma"/><span>QUANDO O SONHAR ATRAVESSA O COTIDIANO</span></div><div className="ro-public-universe__text"><p>Em Reinos Oníricos, o cotidiano e o impossível deixam de ser mundos separados. Desvelados confrontam o extraordinário enquanto tentam manter seus vínculos com a Realidade.</p><p>Um jogo de investigação, decisões e consequências, onde os Domínios do Sonhar permitem transformar o que parecia imutável.</p><div className="ro-public-universe__keywords"><span>FANTASIA URBANA</span><span>HORROR ONÍRICO</span><span>MISTÉRIO</span></div></div></div>
      </section>
      <section className="ro-public-platform" id="plataforma">
        <div className="ro-public-platform__copy"><span className="ro-public-eyebrow">02 · A PLATAFORMA DIGITAL</span><h2>Tudo pronto para <em>contar sua história.</em></h2><p>O RPG ganhou um espaço próprio para Mestres e jogadores. Prepare a campanha, organize seus personagens e continue a aventura em um ambiente conectado.</p><div className="ro-public-platform__features">
          <div><Layers3 size={20}/><span><strong>Mesa Ao Vivo</strong><small>Cenas, mapas, tokens e sessões compartilhadas.</small></span></div>
          <div><ScrollText size={20}/><span><strong>Fichas de Desvelados</strong><small>Atributos, Domínios e recursos em um só lugar.</small></span></div>
          <div><Compass size={20}/><span><strong>Estúdio e compêndio</strong><small>Organização de campanhas, adversários e regras.</small></span></div>
          <div><Users size={20}/><span><strong>Comunidade</strong><small>Compartilhe experiências e acompanhe o projeto.</small></span></div>
        </div><button type="button" className="ro-public-text-link" onClick={onRegister}>Criar minha conta <ArrowRight size={18}/></button></div>
        <div className="ro-public-platform__visual"><div className="ro-public-platform__window"><div className="ro-public-platform__window-bar"><span/><span/><span/> PLATAFORMA REINOS ONÍRICOS</div><img src="/ro-login-portrait.webp" alt="Arte onírica oficial usada na plataforma"/><div className="ro-public-platform__window-caption">Seu universo. Seu grupo. Sua campanha.</div></div></div>
      </section>
      <section className="ro-public-library" id="livros">
        <div className="ro-public-library__heading"><div><span className="ro-public-eyebrow">03 · PUBLICAÇÕES OFICIAIS</span><h2>O universo começa <em>nos livros.</em></h2><p>Conheça as publicações digitais de Reinos Oníricos RPG, criadas por Diogo Zornoff.</p></div><button type="button" className="ro-public-text-link" onClick={()=>shop('combo')}>Ver coleção digital <ArrowRight size={18}/></button></div>
        <div className="ro-public-library__grid">{works.map(work=><article className="ro-public-volume" key={work.id}><div className="ro-public-volume__image"><BrandedBook variant={work.id}/></div><div className="ro-public-volume__content"><span className="ro-public-eyebrow">{work.tag}</span><h3>{work.title}</h3><p>{work.description}</p><small>{work.pages} · PDF</small><button type="button" className="ro-public-text-link" onClick={()=>shop(work.id)}>Conhecer edição <ArrowRight size={17}/></button></div></article>)}</div>
        <div className="ro-public-library__bundle"><span><ShoppingBag size={22}/> <strong>Os dois lados do Sonhar, uma coleção.</strong></span><span>Livro Básico + Livro de Adversários</span><button className="ro-public-button ro-public-button--solid" type="button" onClick={()=>shop('combo')}>Explorar o combo <ArrowRight size={17}/></button></div>
      </section>
      <section className="ro-public-community" id="comunidade"><div><span className="ro-public-eyebrow">04 · UMA COMUNIDADE EM FORMAÇÃO</span><h2>Histórias ficam maiores <em>quando compartilhadas.</em></h2><p>Participe de conversas, conheça outras mesas e acompanhe as novidades de Reinos Oníricos. Os níveis da Comunidade são Aberto, Vigília, Círculo e Guardião, com benefícios próprios.</p><button className="ro-public-button ro-public-button--outline" onClick={onRegister} type="button">Fazer parte <ArrowRight size={17}/></button></div><div className="ro-public-community__art"><MoonStar size={92} strokeWidth={.8}/><span>REALIDADE / SONHAR</span></div></section>
      <section className="ro-public-authors" id="autores"><div className="ro-public-section-heading"><span className="ro-public-eyebrow">05 · QUEM ESTÁ POR TRÁS DO VÉU</span><h2>A obra e a <em>plataforma.</em></h2><p>Duas contribuições diferentes para um mesmo universo.</p></div>
        <div className="ro-public-authors__grid">
          <article><div className="ro-public-authors__photo ro-public-authors__photo--diogo" aria-label="Fotografia de Diogo Zornoff"/><div><span className="ro-public-eyebrow">CRIADOR E AUTOR PRINCIPAL</span><h3>Diogo Zornoff</h3><p>Criador do Reinos Oníricos RPG. Responsável pela concepção do universo, criação do sistema, desenvolvimento e escrita dos livros. Atua também na direção de arte e diagramação das publicações.</p></div></article>
          <article><div className="ro-public-authors__photo ro-public-authors__photo--guilherme" aria-label="Fotografia de Guilherme Califoni"/><div><span className="ro-public-eyebrow">COFUNDADOR · PLATAFORMA DIGITAL</span><h3>Guilherme Califoni</h3><p>Cofundador do projeto, responsável pela criação e desenvolvimento da plataforma web. Colabora na revisão dos livros e, junto a Diogo, na direção de arte e diagramação.</p></div></article>
        </div><p className="ro-public-authors__credit">Créditos editoriais conforme Livro Básico e Livro de Adversários, versão 1.0 (2026).</p>
      </section>
      <section className="ro-public-final"><span className="ro-public-eyebrow">O PRÓXIMO CAPÍTULO</span><h2>O Sonhar não espera <em>por ninguém.</em></h2><p>Crie sua conta e explore a plataforma, ou conheça as publicações que deram origem a este universo.</p><div><button className="ro-public-button ro-public-button--solid" type="button" onClick={onRegister}>Criar minha conta <ArrowRight size={17}/></button><button className="ro-public-button ro-public-button--outline" type="button" onClick={()=>shop('combo')}>Conhecer os livros <BookOpen size={17}/></button></div></section>
    </main>
    <footer className="ro-public-footer"><Signature/><span>Reinos Oníricos RPG © 2026 · Versão de revisão, não publicada</span><a href="#inicio">Voltar ao início ↑</a></footer>
  </div>;
};
