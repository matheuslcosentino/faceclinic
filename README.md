# Face Clinic Odontologia & Saúde — Landing page

Landing page premium da Face Clinic (Balneário Piçarras – SC), com foco em agendamento pelo WhatsApp.

Site **estático** (HTML + CSS + JavaScript), sem etapa de build. As bibliotecas vêm de CDN:

| Biblioteca | Uso |
|---|---|
| GSAP 3.13 + ScrollTrigger | revelações, parallax, hero, seção fixada (pin), jornada |
| Lenis 1.3 | rolagem suave (desktop), integrada ao ScrollTrigger |
| Three.js r170 | molar em "porcelana" com anéis dourados (carregado só quando a seção se aproxima) |
| Google Fonts | Cormorant Garamond (títulos), Manrope (interface), Allura (palavras em caligrafia) |

## Como visualizar

Opção 1: dê dois cliques em `index.html`.

Opção 2 (recomendada, igual ao site publicado): rode um servidor local na pasta e abra o endereço `http://localhost:5510`.

```bash
python -m http.server 5510
```

> **Animações não aparecem?** O site respeita a preferência "reduzir movimento" do sistema. No Windows, se
> *Configurações › Acessibilidade › Efeitos visuais › Efeitos de animação* estiver desligado, o navegador
> mostra a versão estática (completa, mas sem movimento). Para pré-visualizar as animações mesmo assim,
> abra `index.html?animacoes=on`.

## Onde editar

Tudo que muda de um cliente para outro está em **`assets/js/config.js`**:

- dados do profissional (nome, CRO), contatos, Instagram e e-mail;
- endereço e busca do Google Maps (link "Ver localização" e mapa);
- horários (vazio = o site orienta consultar pelo WhatsApp);
- mensagens pré-preenchidas do WhatsApp (agendamento, urgência e por tratamento);
- tratamentos, diferenciais, jornada do paciente, FAQ, galeria e avaliações.

Campos `null` ou listas vazias ficam ocultos no site.

Textos fixos de layout (títulos das seções, por exemplo) estão em `index.html`.
As cores ficam em variáveis no topo de `assets/css/main.css`.

## Estrutura

```
index.html                 página (SEO, dados estruturados, seções)
assets/css/main.css        estilos (tokens de cor, layout, responsivo, estados de animação)
assets/js/config.js        DADOS DO CONSULTÓRIO
assets/js/render.js        monta listas e links a partir do config
assets/js/main.js          animações, menu, tratamentos, FAQ, mapa, lightbox, WhatsApp flutuante
assets/js/scroll-dot.js    o ponto dourado que acompanha a rolagem
assets/js/tooth-scene.js   cena 3D (Three.js)
assets/img/                imagens otimizadas (WebP/JPG), favicons, og-image.jpg
assets/img/consultorio/    fotos do consultório (ver LEIA-ME)
assets/video/              vídeo opcional da hero (ver LEIA-ME)
_originais/                arquivos originais recebidos (não precisa publicar)
robots.txt, sitemap.xml
```

`assets/img/logo-mark.png` é a versão do símbolo para fundos claros (não usada na página, fica de reserva).

## O ponto que acompanha a rolagem

Um ponto dourado nasce no indicador "Role para descobrir". Ele desce pela linha da seção Sobre,
para ao lado do dente 3D em Tratamentos (e se expande), cruza a galeria na lateral e percorre a
linha do tempo da Jornada, com halo no emblema de Urgências. No fim, chega ao CTA final e vira o
ponto luminoso acima do título.

A trajetória é montada a partir de âncoras no HTML (`data-dot="rail"`, `data-dot="point"`,
`data-dot="end"`) e é recalculada sozinha quando a tela muda de tamanho.

## Antes de publicar (checklist)

1. **Domínio**: troque `https://SEU-DOMINIO.com.br` em `index.html` (og:image, og:url e canonical, que estão
   comentados), em `robots.txt` e em `sitemap.xml`.
2. **WhatsApp**: clique em um botão e confirme se a conversa abre no número certo. O site usa
   `5547996188834`, o número publicado no Google. Se não abrir, use o formato do briefing (`554796188834`)
   em `config.js`.
3. **Endereço**: João de Deus Carvalo, 2175, Bairro Santo Antônio, em Balneário Piçarras – SC.
4. **CRO**: o site apresenta "Responsável técnico: Dr. José Carlos Fiamenghi Jr. — CRO/SC 11053", número
   da bio do Instagram. Confirme se é o CRO do profissional (e não da clínica).
5. **Números da bio** (+23 anos / +8 mil pacientes): estão em `stats` no `config.js`. "Pacientes
   transformados" virou "pacientes atendidos" para evitar promessa de resultado.
6. **Avaliações**: são trechos reais do Google, com nome abreviado e link para a fonte. Confirme se a
   divulgação segue as normas do CFO/CRO-SC. Para remover, use `reviews.enabled: false`.
7. **Horários**: preencha `hours` quando a clínica confirmar.
8. **Fotos do consultório**: veja `assets/img/consultorio/LEIA-ME.txt`.
9. **Foto do profissional**: a atual tem 465×790 px. Uma versão com 1600 px ou mais deixa a hero mais nítida.
   Basta substituir `assets/img/dr-jose-carlos.webp` e `.jpg` mantendo os nomes.

## Publicação

Envie todo o conteúdo da pasta para a hospedagem (Hostinger, Netlify, Vercel, GitHub Pages etc.),
**exceto** `_originais/` e `.claude/`. Não há build.

## Desempenho e acessibilidade

- Foto da hero com `fetchpriority="high"` e pré-carregada. As demais imagens usam `loading="lazy"`.
- Three.js e o mapa só carregam quando a seção se aproxima. O modelo 3D é gerado em blocos, sem travar a página.
- A cena 3D pausa fora da tela e tem fallback estático quando não há WebGL.
- Navegação por teclado, foco visível, menu mobile com `inert`, FAQ e tratamentos com `aria-expanded`,
  lightbox com `<dialog>`.
- Com "reduzir movimento", o site fica sem animações, sem rolagem suave e sem o ponto. Todo o conteúdo
  continua visível.

## Licenças de terceiros

GSAP (licença padrão gratuita da GreenSock/Webflow), Three.js (MIT), Lenis (MIT), fontes Google (SIL OFL).
