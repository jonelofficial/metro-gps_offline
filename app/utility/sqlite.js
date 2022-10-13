import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabase("db.db");

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

export const createTable = async (tableName, fields) => {
  db.transaction((tx) => {
    tx.executeSql(`CREATE TABLE IF NOT EXISTS ${tableName} (${fields})`),
      (transact, resultset) => console.log(resultset),
      (transact, err) => console.log(err);
  });
};
