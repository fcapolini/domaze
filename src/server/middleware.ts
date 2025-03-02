import { DomazeLogger } from "./logger";
import { NextFunction, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Compiler } from "../compiler/compiler";
import { Document, Element, NodeType } from "../html/dom";
import { PageError } from "../html/parser";

export const CLIENT_CODE_REQ = '/.domaze.js';

export interface DomazeProps {
  docroot: string;
  ssr?: boolean;
  csr?: boolean;
  logger?: DomazeLogger;
  clientCodePath?: string;
  // virtualFiles?: Array<VirtualFile>;
}

export function domaze(props: DomazeProps) {
  props.clientCodePath ??= path.join(__dirname, 'client.js');
  const docroot = props.docroot || process.cwd();
  const compiler = new Compiler({ docroot });
  const clientCode = props.csr
    ? fs.readFileSync(props.clientCodePath).toString()
    : '';

  return async function(req: Request, res: Response, next: NextFunction) {
    const i = req.path.lastIndexOf('.');
    const extname = i < 0 ? '.html' : req.path.substring(i).toLowerCase();

    // handle non-page requests
    if (req.path === CLIENT_CODE_REQ) {
      res.header('Content-Type', 'text/javascript;charset=UTF-8');
      res.send(clientCode);
      return;
    }
    if (req.path.startsWith('/.') || extname === '.htm') {
      res.sendStatus(404);
      return;
    }
    if (extname !== '.html') {
      return next();
    }

    // if path is a dir, access <dir>/index.html
    let pathname = i < 0 ? req.path : req.path.substring(0, i).toLowerCase();
    if (i < 0) {
      try {
        const fullPath = path.join(docroot, pathname);
        const stat = await fs.promises.stat(fullPath);
        if (stat.isDirectory()) {
          pathname = path.join(pathname, 'index');
        }
      } catch (ignored) { /* nop */ }
    }

    const page = await compiler.compile(pathname + '.html');
    if (page.source.errors.length) {
      return serveErrorPage(page.source.errors, res);
    }

    let doc: Document = page.source.doc!;

    if (props.ssr) {
      // doc = (doc as ServerDocument).clone(null, null);
      // new RuntimePage(
      //   page => new ServerGlobal(page, doc, comp.props!)
      // );
    }

    if (props.csr && doc && doc.documentElement) {
      for (const n of doc.documentElement.childNodes) {
        if (
          n.nodeType === NodeType.ELEMENT &&
          (n as Element).tagName === 'BODY'
        ) {
          const script = doc.createElement('script');
          script.setAttribute('src', CLIENT_CODE_REQ);
          (n as Element).appendChild(script);
          break;
        }
      }
    }

    const html = doc.toString();
    res.header('Content-Type', 'text/html;charset=UTF-8');
    res.send('<!doctype html>\n' + html);
  }
}

function serveErrorPage(errors: PageError[], res: Response) {
  const p = new Array<string>();
  p.push(`<!doctype html><html><head>
    <title>Page Error</title>
    <meta name="color-scheme" content="light dark"/>
    </head><body><ul>`);
  errors.forEach(err => {
    const l = err.loc;
    p.push(`<li>${err.msg}`);
    l && p.push(` - ${l.source} `);
    l && p.push(`[${l.start.line}, ${l.start.column + 1}]`);
    p.push('</li>');
  });
  p.push('</ul></body></html>');
  res.header('Content-Type', 'text/html;charset=UTF-8');
  // res.sendStatus(500);
  res.send(p.join(''));
}
