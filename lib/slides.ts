export type Slide={id:string;title:string;body:string;notes:string;image?:string;layout?:"split"|"hero"|"minimal";accent?:string};
export type Deck={title:string;topic:string;grade:string;slides:Slide[];theme?:"editorial"|"modern"};
export function templateDeck(topic:string,grade:string):Deck {return {title:topic,topic,grade,theme:"editorial",slides:[
{id:'s1',title:topic,body:`Língua Portuguesa • ${grade}\nApresentação de estudo`,notes:'Apresente o tema e ative os conhecimentos prévios.'},
{id:'s2',title:'Objetivos da aula',body:`• Compreender o tema: ${topic}\n• Identificar exemplos em textos\n• Aplicar os conceitos em situações reais`,notes:'Ajuste os objetivos à turma.'},
{id:'s3',title:'Investigação inicial',body:`O que você já sabe sobre ${topic}?\n\nRegistre duas hipóteses e compartilhe com a turma.`,notes:'Atividade diagnóstica.'},
{id:'s4',title:'Exploração do conteúdo',body:`Insira aqui a explicação fundamentada sobre ${topic}.\n\nUse o editor ou o gerador de IA para desenvolver o conteúdo.`,notes:'Este é um modelo editável, não uma aula pronta revisada.'},
{id:'s5',title:'Prática e discussão',body:`Encontre exemplos de ${topic} em um texto escolhido.\n\nExplique suas escolhas e compare com colegas.`,notes:'Selecione texto adequado à faixa etária.'},
{id:'s6',title:'Síntese e avaliação',body:`• O que aprendemos?\n• Qual dúvida permanece?\n• Como aplicar esse conhecimento?`,notes:'Verifique aprendizagem e retome dificuldades.'}
]}}
export function validDeck(v:unknown):v is Deck {if(!v||typeof v!=='object')return false;const d=v as Deck;return typeof d.title==='string'&&typeof d.topic==='string'&&typeof d.grade==='string'&&Array.isArray(d.slides)&&d.slides.length>=1&&d.slides.length<=25&&d.slides.every(s=>typeof s.id==='string'&&typeof s.title==='string'&&typeof s.body==='string'&&typeof s.notes==='string'&&s.title.length<250&&s.body.length<6000&&(!s.image||(typeof s.image==='string'&&s.image.length<1400000&&(/^(data:image\/(png|jpeg|webp);base64,|https:\/\/)/.test(s.image))))&&(!s.layout||['split','hero','minimal'].includes(s.layout)))}
