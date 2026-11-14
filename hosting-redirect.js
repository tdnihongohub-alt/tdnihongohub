// GitHub stores the source; Firebase serves the compiled application.
// If the source branch is accidentally published with Pages, use the official host.
const pagesHost = 'tdnihongohub-alt.github.io';
const projectPath = '/tdnihongohub';
if (window.location.hostname === pagesHost &&
    (window.location.pathname === projectPath || window.location.pathname.startsWith(projectPath + '/'))) {
  const path = window.location.pathname.slice(projectPath.length) || '/';
  const target = new URL('https://td-nihongo-hub.web.app/');
  target.pathname = path;
  target.search = window.location.search;
  target.hash = window.location.hash;
  window.location.replace(target.href);
}
