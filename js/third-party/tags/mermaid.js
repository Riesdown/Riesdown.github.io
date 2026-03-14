/* global NexT, CONFIG, mermaid */

const MERMAID_SYNTAX = /^(?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|sankey-beta|xychart-beta|quadrantChart|requirementDiagram|packet|block-beta|architecture(?:-beta)?|kanban)\b/m;

function normalizeMermaidSource(source) {
  let normalized = source.replace(/\\n/g, '<br/>');

  // Mermaid 11 is stricter for multiline labels in decision / rect nodes.
  // Convert `A[text<br/>text]` => `A["text<br/>text"]`
  normalized = normalized.replace(/(\b[\w-]+)\[(?!")([^\]]*<br\/>[^\]]*)\]/g, (_match, id, label) => {
    return `${id}["${label}"]`;
  });

  normalized = normalized.replace(/(\b[\w-]+)\{(?!")([^}]*(?:<br\/>|[?])[^}]*)\}/g, (_match, id, label) => {
    return `${id}{"${label}"}`;
  });

  normalized = normalized.replace(/(\b[\w-]+)\((?!")([^)]*<br\/>[^)]*)\)/g, (_match, id, label) => {
    return `${id}("${label}")`;
  });

  return normalized;
}

function extractHighlightedCodeText(codeElement) {
  const lineElements = codeElement.querySelectorAll('.line');
  if (lineElements.length) {
    return Array.from(lineElements)
      .map(line => line.textContent)
      .join('\n');
  }

  return codeElement.textContent;
}

document.addEventListener('page:loaded', async () => {
  const diagramBlocks = [];

  document.querySelectorAll('pre > .mermaid').forEach(element => {
    diagramBlocks.push({
      container: element.parentNode,
      source   : element.textContent
    });
  });

  // Support fenced blocks like ```mermaid rendered by the Markdown engine
  // as plaintext highlighted code blocks.
  document.querySelectorAll('figure.highlight.plaintext').forEach(figure => {
    const code = figure.querySelector('td.code pre');
    if (!code) return;

    const text = extractHighlightedCodeText(code).trim();
    if (MERMAID_SYNTAX.test(text)) {
      diagramBlocks.push({
        container: figure,
        source   : text
      });
    }
  });

  if (!diagramBlocks.length) return;

  await NexT.utils.getScript(CONFIG.mermaid.js, {
    condition: window.mermaid
  });

  diagramBlocks.forEach(block => {
    const box = document.createElement('div');
    box.className = 'code-container';

    const newElement = document.createElement('div');
    newElement.className = 'mermaid';
    newElement.textContent = normalizeMermaidSource(block.source.trim());
    box.appendChild(newElement);

    if (CONFIG.codeblock.copy_button.enable) {
      NexT.utils.registerCopyButton(box, box, block.source);
    }

    block.container.parentNode.replaceChild(box, block.container);
  });

  mermaid.initialize({
    theme    : CONFIG.darkmode && window.matchMedia('(prefers-color-scheme: dark)').matches ? CONFIG.mermaid.theme.dark : CONFIG.mermaid.theme.light,
    logLevel : 4,
    flowchart: { curve: 'linear' },
    gantt    : { axisFormat: '%m/%d/%Y' },
    sequence : { actorMargin: 50 }
  });
  mermaid.run();
});
