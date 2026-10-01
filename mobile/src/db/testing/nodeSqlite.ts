/// <reference types="node" />
/**
 * 테스트 전용: Node 내장 SQLite(`node:sqlite`)로 `SQLiteDatabase`의 일부를 흉내 낸다.
 * 앱 코드가 쓰는 메서드(execAsync, runAsync, getAllAsync, getFirstAsync,
 * withTransactionAsync)만 구현한다. 실제 SQL과 제약 조건은 그대로 실행되지만
 * expo-sqlite 네이티브 구현과 완전히 같지는 않으므로 실기기 검증을 대체하지 않는다.
 * Node 타입 참조는 이 파일에만 둔다(앱 코드가 Node API를 쓰지 않게 하기 위함).
 */
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

import type { SQLiteDatabase } from "expo-sqlite";

import { migrateDbIfNeeded } from "../migrations";

type Param = SQLInputValue | undefined;

const bind = (params: Param[]): SQLInputValue[] =>
  params.map((p) => (p === undefined ? null : p));

/** 메모리 DB를 만들고 앱과 같은 마이그레이션을 적용해 돌려준다. */
export async function createTestDb(): Promise<SQLiteDatabase> {
  const raw = new DatabaseSync(":memory:");

  const db = {
    execAsync: async (sql: string) => {
      raw.exec(sql);
    },
    runAsync: async (sql: string, ...params: Param[]) => {
      const r = raw.prepare(sql).run(...bind(params));
      return {
        lastInsertRowId: Number(r.lastInsertRowid),
        changes: Number(r.changes),
      };
    },
    getAllAsync: async (sql: string, ...params: Param[]) =>
      raw.prepare(sql).all(...bind(params)),
    getFirstAsync: async (sql: string, ...params: Param[]) =>
      raw.prepare(sql).get(...bind(params)) ?? null,
    withTransactionAsync: async (task: () => Promise<void>) => {
      raw.exec("BEGIN");
      try {
        await task();
        raw.exec("COMMIT");
      } catch (e) {
        raw.exec("ROLLBACK");
        throw e;
      }
    },
  } as unknown as SQLiteDatabase;

  await migrateDbIfNeeded(db);
  return db;
}

/** 테이블 행 수. 삭제 연쇄 검증용. */
export async function countRows(
  db: SQLiteDatabase,
  table: "passage" | "sentence" | "vocab" | "review" | "question",
): Promise<number> {
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) AS c FROM ${table}`,
  );
  return row?.c ?? 0;
}
