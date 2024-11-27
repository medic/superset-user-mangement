/**
 * Helper function to parse CHA details from CSV
 */

import fs from "fs";
import csv from "csv-parser";
import { CSVUser } from "../types/user";

export async function readUsersFromFile(fileName: string): Promise<CSVUser[]> {
  return new Promise((resolve, reject) => {
    const csvUsers: CSVUser[] = [];

    fs.createReadStream(fileName)
      .on('error', (error) => {
        reject(new Error(`File not found: ${error.message}`));
      })
      .pipe(csv())
      .on('data', (data: CSVUser) => {
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