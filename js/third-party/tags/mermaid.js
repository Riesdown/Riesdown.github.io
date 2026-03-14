/* global NexT, CONFIG, mermaid */

const MERMAID_SYNTAX = /^(?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|sankey-beta|xychart-beta|quadrantChart|requirementDiagram|packet|block-beta|architecture(?:-beta)?|kanban)\b/m;

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

    const text = code.textContent.trim();
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
    newElement.textContent = block.source.trim();
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
