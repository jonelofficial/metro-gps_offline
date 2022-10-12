import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabase("db.db");

export const selectTable = async (tableName) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(`select * from ${tableName}`, [], (_, { rows }) => {
        resolve(rows);
      }),
        (transact, err) => reject(err);
    });
  });
};

export const deleteFromTable = async (query) => {
  db.transaction((tx) => {
    tx.executeSql(
      `delete from ${query}`,
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

export const createTable = async (tableName, fields) => {
  db.transaction((tx) => {
    tx.executeSql(`create table if not exists ${tableName} (${fields})`),
      (transact, resultset) => console.log(resultset),
      (transact, err) => console.log(err);
  });
};
