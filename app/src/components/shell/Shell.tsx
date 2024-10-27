// src/App.tsx
import React, { useEffect, useRef } from "react";
import "xterm/css/xterm.css";
import "./Shell.css";

import * as shell from "@duckdb/duckdb-wasm-shell";
import shell_wasm from "@duckdb/duckdb-wasm-shell/dist/shell_bg.wasm?url";

import db from "../../duckDB";

type ShellProps = Record<string, string>;

const Shell: React.FC<ShellProps> = (props: ShellProps) => {
  const term = React.useRef<HTMLDivElement | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!term.current || initialized.current) return;
    const embedShell = async () => {
      await shell.embed({
        shellModule: shell_wasm,
        container: term.current!,
        resolveDatabase: async (props) => {
          return db;
        },
      });
    };
    embedShell();
    initialized.current = true; // Set the flag to true after initialization

    return () => {
      if (term.current) {
        term.current.innerHTML = "";
      }
    };
  }, []);

  return <div ref={term} className="container"></div>;
};

export default Shell;
