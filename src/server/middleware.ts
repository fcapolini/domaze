import { DomazeLogger } from "./logger";
import { NextFunction, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Compiler } from "../compiler/compiler";
import { Document, Element, NodeType } from "../html/dom";
import { PageError } from "../html/parser";
import { ServerDocument } from "../html/server-dom";
import { Context, ContextProps } from "../runtime/context";
import { generate } from "escodegen";
import { PROPS_GLOBAL } from "../runtime/const";

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

    let doc = page.source.doc!;
    const propsJs = props.ssr || props.csr ? generate(page.code) : '';

    if (props.ssr) {
      const root = eval(propsJs);
      const e = doc.documentElement;
      doc = new ServerDocument(doc.loc);
      const docElement = e!.clone(doc, null);
      doc.childNodes.push(docElement);
      const props: ContextProps = { doc, root };
      new Context(props);
    }

    if (props.csr && doc && doc.documentElement) {
      for (const n of doc.documentElement.childNodes) {
        if (
          n.nodeType === NodeType.ELEMENT &&
          (n as Element).tagName === 'BODY'
        ) {
          const script1 = doc.createElement('script');
          script1.appendChild(doc.createTextNode(`${PROPS_GLOBAL} = ${propsJs}`));
          (n as Element).appendChild(script1);
          const script2 = doc.createElement('script');
          script2.setAttribute('src', CLIENT_CODE_REQ);
          (n as Element).appendChild(script2);
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
