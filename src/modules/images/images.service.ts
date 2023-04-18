
import { Injectable, Inject} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';


@Injectable()
export class ImagesService {
    constructor(private database: DatabaseService, ){}

    async getAnalysisImage(batch_id: number){
        let ressObj
        return ressObj

    }

    async getMesurementMask(batch_id: any){
        try{
            const result = await this.database.executeQuery
                (
                    `
                    SELECT t_msr."name"  as measurements,
                        msr.args as elasticity,
                        (msr.args ->> 'images') as mask_image,
                        (msr.args ->> 'score') as score,
                        (msr.args ->> 'rawValue') as rawValue
                    FROM analysis as an
                    INNER JOIN measurements as msr ON msr.batch_id = an.batch_id
                    INNER JOIN (SELECT * FROM type_measurements GROUP BY name, id) as t_msr ON t_msr.id = msr.type_measurement_id
                    WHERE an.batch_id = ${batch_id};
                    `
                )
            let returnObj = {};
            let redness = null
            let oiliness = null
            let radiance = null
            let dullness = null
            let pores = null
            let impurities = null
            let wrinkle = null
            let dark_circle = null
            let hyperpigmentation = null
            let pigmentation = null
            let additonalResult = null
            let measurRes = result['rows'];
            let elesticity_score = null;
            let skin_age = null;
            let skin_condition = null;



            if(result['rowCount'] > 0){
                for(let i = 0; i < measurRes.length; i++){
                    if(measurRes[i].measurements === 'elasticity'){
                        elesticity_score = measurRes[i]?.elasticity?.args?.elesticity_score;
                        skin_age = measurRes[i]?.elasticity?.args?.skin_age;
                        skin_condition = measurRes[i]?.elasticity?.args?.skin_condition;
                    }
                    if(measurRes[i].measurements === 'redness'){    
                        redness = { 
                                images: {
                                    front: JSON.parse(measurRes[i]?.mask_image)?.front?.url,
                                    left: JSON.parse(measurRes[i]?.mask_image)?.left?.url,
                                    right: JSON.parse(measurRes[i]?.mask_image)?.right?.url,
                                },
                                score: JSON.parse(measurRes[i]?.score),
                                rawValue: JSON.parse(measurRes[i]?.rawvalue)   
                        }
                    }
                    if(measurRes[i].measurements === 'oiliness'){   
                        oiliness = {
                            score: JSON.parse(measurRes[i].score)?.oiliness_final_score,
                            rawValue: JSON.parse(measurRes[i].score)?.oiliness_raw, 
                            images: {
                                frontW: JSON.parse(measurRes[i]?.mask_image)?.frontW?.url,
                                frontG: JSON.parse(measurRes[i]?.mask_image)?.frontG?.url,  
                            }
                        }
                    }
                   
                    if(measurRes[i].measurements === 'dullness'){     
                        dullness = {
                            score: JSON.parse(measurRes[i].score)?.dullness_final_score,
                            // final_raw: JSON.parse(measurRes[i].score)?.oiliness_raw, 
                            images: {
                                frontW: JSON.parse(measurRes[i]?.mask_image)?.frontW?.url,
                                frontG: JSON.parse(measurRes[i]?.mask_image)?.frontG?.url,  
                            }
                        }
                    }
                    if(measurRes[i].measurements === 'pores'){    
                        pores = {
                            score: JSON.parse(measurRes[i].score)?.pores_final_score,
                            rawValue: JSON.parse(measurRes[i].score)?.pores_final_raw, 
                            image: {
                                front: JSON.parse(measurRes[i]?.mask_image)?.front?.url
                            }
                        }
                    }
                    if(measurRes[i].measurements === 'impurities'){    
                        impurities = {
                            score: JSON.parse(measurRes[i].score)?.impurities_final_score,
                            rawValue: JSON.parse(measurRes[i].score)?.impurities_final_raw, 
                            images: {
                                front: JSON.parse(measurRes[i]?.mask_image)?.front?.url
                            }
                        }
                    }

                    if(measurRes[i].measurements === 'wrinkle'){    
                        wrinkle = { 
                            images: {
                                front: JSON.parse(measurRes[i]?.mask_image)?.front?.url,
                                left: JSON.parse(measurRes[i]?.mask_image)?.left?.url,
                                right: JSON.parse(measurRes[i]?.mask_image)?.right?.url,
                            },
                            score: JSON.parse(measurRes[i]?.score),
                            rawValue: JSON.parse(measurRes[i]?.rawvalue)
                        }
                    }
                    if(measurRes[i].measurements === 'dark_circle'){    
                        dark_circle = { 
                            images: {
                                front: JSON.parse(measurRes[i]?.mask_image)?.front?.url,
                            },
                            score: JSON.parse(measurRes[i]?.score),
                            rawValue: JSON.parse(measurRes[i]?.rawvalue)
                        }
                    }
                    //hyperpigmentation
                    if((measurRes[i].measurements) === 'hyperpigmentation'){    
                        hyperpigmentation = { 
                            images: {
                                front: JSON.parse(measurRes[i]?.mask_image)?.front?.url,
                                left: JSON.parse(measurRes[i]?.mask_image)?.left?.url,
                                right: JSON.parse(measurRes[i]?.mask_image)?.right?.url,
                            },
                            score: JSON.parse(measurRes[i]?.score),
                            rawValue: JSON.parse(measurRes[i]?.rawvalue)
                        }
                    }
                    if(measurRes[i].measurements === 'pigmentation'){    

                        pigmentation = { 
                            images: {
                                front: JSON.parse(measurRes[i]?.mask_image)?.front?.url,
                                left: JSON.parse(measurRes[i]?.mask_image)?.left?.url,
                                right: JSON.parse(measurRes[i]?.mask_image)?.right?.url,
                            },
                            score: JSON.parse(measurRes[i]?.score),
                            rawValue: JSON.parse(measurRes[i]?.rawvalue)
                        }
                    }
                }

                returnObj = {
                    redness: redness,
                    oiliness: oiliness,
                    radiance: radiance,
                    dullness: dullness,
                    pores: pores,
                    impurities: impurities,
                    wrinkle: wrinkle,
                    dark_circle: dark_circle,
                    hyperpigmentation: hyperpigmentation,
                    pigmentation: pigmentation,
                    elesticity_score: elesticity_score,
                    skin_age: skin_age,
                    skin_condition: skin_condition,
                }
            }
            return returnObj     
        }catch(e){
            throw new Error(e);
        }
    }

    async getOriginalImage(hash: string) {
        const getHash = await this.database.executeQuery
        (
            `
            SELECT sys_url
            FROM images
            WHERE hash = '${hash}'
            `
        ) 
        return getHash['rows']
    }


    async getMaskImage(hash: string) {
        const getHash = await this.database.executeQuery
        (
            `
            SELECT args ->> 'images' as imageArg FROM measurements
            WHERE 
                args->'images'->>'front' ilike '%${hash}%'
             OR
              args->'images'->>'right' ilike '%${hash}%'
             OR 
                args->'images'->>'left' ilike '%${hash}%'
             OR 
                args->'images'->>'frontW' ilike '%${hash}%'
             OR 
                args->'images'->>'frontG' ilike '%${hash}%'
            `
        ) 

        let sys_url
        if(JSON.parse(getHash['rows'][0]?.imagearg)?.front) {
            console.log("here front", JSON.parse(getHash['rows'][0]?.imagearg)?.front?.sys_url)

            if(JSON.parse(getHash['rows'][0]?.imagearg)?.front?.hash === hash ) sys_url = JSON.parse(getHash['rows'][0]?.imagearg)?.front?.sys_url
        }
        
        if(JSON.parse(getHash['rows'][0]?.imagearg)?.left) {
            console.log("here left", JSON.parse(getHash['rows'][0]?.imagearg)?.left?.sys_url)

            if(JSON.parse(getHash['rows'][0]?.imagearg)?.left?.hash === hash ) sys_url = JSON.parse(getHash['rows'][0]?.imagearg)?.left?.sys_url
        }

        if(JSON.parse(getHash['rows'][0]?.imagearg)?.right) {
            console.log("here right", JSON.parse(getHash['rows'][0]?.imagearg)?.right?.sys_url)

            if(JSON.parse(getHash['rows'][0]?.imagearg)?.right?.hash === hash ) sys_url = JSON.parse(getHash['rows'][0]?.imagearg)?.right?.sys_url
        }

        if(JSON.parse(getHash['rows'][0]?.imagearg)?.frontG) {
            console.log("here frontG", JSON.parse(getHash['rows'][0]?.imagearg)?.frontG?.sys_url)

            if(JSON.parse(getHash['rows'][0]?.imagearg)?.frontG?.hash === hash ) sys_url = JSON.parse(getHash['rows'][0]?.imagearg)?.frontG?.sys_url
        }

        if(JSON.parse(getHash['rows'][0]?.imagearg)?.frontW) {
            if(JSON.parse(getHash['rows'][0]?.imagearg)?.frontW?.hash === hash ) sys_url = JSON.parse(getHash['rows'][0]?.imagearg)?.frontW?.sys_url
        }
        return sys_url
    }
}