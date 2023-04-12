import { Injectable, Inject} from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseService } from 'src/database/database.service';


@Injectable()
export class DataSavingService {
    constructor(private database: DatabaseService, ){}

    async insertInAnalysis(customer_id: any, args: any){
        const insert = await this.database.executeQuery
            (`
                INSERT INTO analysis (customer_id, args) 
                values (${customer_id}, '${args}') RETURNING *
            `)

        // console.log("insert result", insert['rows'][0]['batch_id']);
        return insert['rows'][0]['batch_id']
    }

    async updateLight(batch_id: number, PRE_light: any,  POST_light: any){
        try{

            let light_ = {
                "POST_light": POST_light,
                "PRE_light": PRE_light
            }
            let light = JSON.stringify(light_)

            const update = await this.database.executeQuery (
                `
                UPDATE analysis
                SET args = args::jsonb || '${light}' :: jsonb
                WHERE batch_id = ${batch_id}
                `
                )
        }catch(e){
            console.log(e)
        }
    }

    async insertInMesurement(batch_id: any, args: any, type_measurement_id: any){
        try{
            const insert = this.database.executeQuery
                (
                    `
                        INSERT INTO measurements (batch_id, args, type_measurement_id) 
                        values (${batch_id},'${args}', ${type_measurement_id})
                    `
                )
            return (await insert).length    
        }catch(e){
            throw new Error(e);
        }
    }

    async getMeasurmant(name : string){
        try{
            const mesureId = await this.database.executeQuery(`SELECT id FROM type_measurements WHERE name = '${name}'`)
            return mesureId['rows'][0]['id']
        }catch(e){
            throw new Error(e)
        } 
    }

    async insertImage(batch_id: any, url: string, sys_url: string, hash: string, type_image_id: any, args: any){
        try{
            const insert = this.database.executeQuery
                (
                    `
                        INSERT INTO images (batch_id, url, sys_url, hash, type_image_id, args) 
                        values (${batch_id}, '${url}', '${sys_url}', '${hash}', ${type_image_id}, '${args}')
                    `
                )
            return (await insert).length    
        }catch(e){
            throw new Error(e);
        }
    }

    async getImage(name: any) {
        try{
            const mesureId = await this.database.executeQuery(`SELECT id FROM type_images WHERE name = '${name}'`)
            if(mesureId['rows'][0]['id']){
                return mesureId['rows'][0]['id']
            }else{
                throw new Error("Image was not found")
            }
        }catch(e){
            throw new Error(e)
        } 

    }
}