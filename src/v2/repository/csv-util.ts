/**
 * Helper function to parse CHA details from CSV
 */

import fs from "fs";
import csv from "csv-parser";
import { CSVUser } from "../model/user.model";

export async function parseCSV(fileName: string): Promise<CSVUser[]> {
  let csvUsers: CSVUser[] = []

  fs.createReadStream(fileName)
  .on('error', () => {
    throw new Error('File not found')
  })
  .pipe(csv())
  .on('data', (data: CSVUser) => {
    csvUsers.push(data);
  })
  .on('error', (error: Error) => {
    console.log(error.message);
  })
  .on('end', () => {
    console.log(csvUsers)
    console.log(`Processed ${csvUsers.length} successfully`);
  });

  return csvUsers;
}