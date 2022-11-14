import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabase("db.db");

db.exec(
  [
    {
      sql: 'PRAGMA cache_size=8192; PRAGMA encoding="UTF-8"; PRAGMA synchronous=NORMAL; PRAGMA temp_store=FILE;',
      args: [],
    },
  ],
  false,
  () => console.log("Foreign keys turned on")
);

export const selectTable = async (tableName) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(`SELECT * FROM ${tableName}`, [], (_, { rows }) => {
        resolve(rows._array);
      }),
        (transact, err) => reject(err);
    });
  });
};

export const dropTable = async (query) => {
  db.transaction((tx) => {
    tx.executeSql(
      `DROP TABLE ${query}`,
      (transact, resultset) => console.log(resultset),
      (transact, err) => console.log(err)
    );
  });
};

export const deleteFromTable = async (query) => {
  db.transaction((tx) => {
    tx.executeSql(
      `DELETE FROM ${query}`,
      (transact, resultset) => console.log(resultset),
      (transact, err) => console.log(err)
    );
  });
};

export const insertToTable = async (query, values) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        values,
        (transact, resultset) => resolve(resultset),
        (transact, err) => reject(err)
      );
    });
  });
};

export const updateToTable = async (query, values) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        values,
        (transact, resultset) => resolve(resultset),
        (transact, err) => reject(err)
      );
    });
  });
};

export const createTable = async (tableName, fields) => {
  db.transaction((tx) => {
    tx.executeSql(`CREATE TABLE IF NOT EXISTS ${tableName} (${fields})`),
      (transact, resultset) => console.log(resultset),
      (transact, err) => console.log(err);
  });
};

export const showTable = async () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT name FROM sqlite_schema WHERE type ='table'",
        (transact, resultset) => resolve(resultset),
        (transact, err) => reject(err)
      );
    });
  });
};
