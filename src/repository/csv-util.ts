/**
 * Helper function to parse CHA details from CSV
 */

import fs from "fs";
import csv from "csv-parser";

export async function readUsersFromFile<T>(fileName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const csvUsers: T[] = [];

    fs.createReadStream(fileName)
      .on('error', (error) => {
        reject(new Error(`File not found: ${error.message}`));
      })
      .pipe(csv())
      .on('data', (data: T) => {
        csvUsers.push(data);
      })
      .on('error', (error: Error) => {
        reject(error);
      })
      .on('end', () => {
        console.log(`Processed ${csvUsers.length} users successfully`);
        resolve(csvUsers);
      });
  });
}