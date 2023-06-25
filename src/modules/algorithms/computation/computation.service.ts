import { Injectable, Inject, HttpException } from '@nestjs/common';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { DatabaseService } from 'src/database/database.service';
import * as celery from 'celery-node';
import { v4 as uuidv4 } from 'uuid';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';
import fs from 'fs';
import { FileUploadService } from '../../../common/FileUpload/fileUpload.service';
import { BatchAnalysisService } from 'src/modules/analysis/batchAnalysis/batchAnalysis.service';

@Injectable()
export class ComputationService {
    constructor(
        private database: DatabaseService,
        private S3Image: FileUploadService,
        private batchAnalysis: BatchAnalysisService,
    ) {}

    // SKIN QUESTIONNAIRES
    quest_score(ans: any) {
        //1 -> 1
        //2 -> 2
        //3 -> 3
        //4 -> 4
        //5 -> 2.5

        let ansArr = ans.split('');
        let length = ansArr.length;
        let result = 0;
        console.log('answers: ', ans);
        // console.log(===> ansArr)
        let questionnaire_score = 0;
        for (let i = 0; i < ansArr.length; i++) {
            if (ansArr[i] === 'A' || ansArr[i] === '0') {
                questionnaire_score += 1;
            } else if (ansArr[i] === 'B' || ansArr[i] === '1') {
                questionnaire_score += 2;
            } else if (ansArr[i] === 'C' || ansArr[i] === '2') {
                questionnaire_score += 3;
            } else if (ansArr[i] === 'D' || ansArr[i] === '3') {
                questionnaire_score += 4;
            } else if (ansArr[i] === 'E' || ansArr[i] === '4') {
                questionnaire_score += 2.5;
            }
        }
        if (questionnaire_score === 0) return 0;
        result = (questionnaire_score - length) / (4 * length - length);
        result = Math.round(result * 99);
        return result;
    }
    cndp_computation(analysis_type: any, scores: any, questionnaire_score: any) {
        // No analysis or questionnaire is done.
        let combined_scores = 0;
        let computed_score = 0;
        if (analysis_type.toLowerCase() === 'wrinkle' || analysis_type.toLowerCase() === 'wrinkles') {
            combined_scores = scores.reduce((sum: any, a: any) => sum + a, 0);
            const avg = Math.round(combined_scores / scores.length);
            if (questionnaire_score === 0) {
                return Math.round(avg);
            }
            computed_score = 0.8 * avg + 0.2 * questionnaire_score;

            return computed_score;
        } else if (analysis_type.toLowerCase() === 'spot' || analysis_type.toLowerCase() === 'spots') {
            combined_scores = scores.reduce((sum: any, a: any) => sum + a, 0);
            const avg = Math.round(combined_scores / scores.length);
            if (questionnaire_score === 0) {
                return Math.round(avg);
            }
            computed_score = 0.8 * avg + 0.2 * questionnaire_score;
            return computed_score;
        } else if (analysis_type.toLowerCase() === 'pores' || analysis_type.toLowerCase() === 'pore') {
            computed_score = scores.reduce((sum: any, a: any) => sum + a, 0);
            return Math.round(computed_score / scores.length);
        } else if (analysis_type.toLowerCase() === 'redness' || analysis_type.toLowerCase() === 'sensitivity') {
            combined_scores = scores.reduce((sum: any, a: any) => sum + a, 0);
            const avg = Math.round(combined_scores / scores.length);
            if (questionnaire_score === 0) {
                return Math.round(avg);
            }
            computed_score = 0.8 * avg + 0.2 * questionnaire_score;
            return computed_score;
        } else if (analysis_type.toLowerCase() === 'oiliness') {
            combined_scores = scores.reduce((sum: any, a: any) => sum + a, 0);
            const avg = Math.round(combined_scores / scores.length);
            if (questionnaire_score === 0) {
                return Math.round(avg);
            }
            computed_score = 0.8 * avg + 0.2 * questionnaire_score;
            return computed_score;
        } else if (analysis_type.toLowerCase() === 'impurities') {
            computed_score = scores.reduce((sum: any, a: any) => sum + a, 0);
            console.log(
                'impurities',
                'scores:',
                scores,
                'computed_score',
                computed_score,
                'questionnaire_score: ',
                questionnaire_score,
            );
            return Math.round(computed_score / scores.length);
        } else if (analysis_type.toLowerCase() === 'keratin') {
            computed_score = scores.reduce((sum: any, a: any) => sum + a, 0);
            console.log(
                'keratin',
                'scores:',
                scores,
                'computed_score',
                computed_score,
                'questionnaire_score: ',
                questionnaire_score,
            );
            return Math.round(computed_score / scores.length);
        } else if (analysis_type.toLowerCase() === 'elasticity') {
            computed_score = scores.reduce((sum: any, a: any) => sum + a, 0);
            console.log(
                'elasticity',
                'scores:',
                scores,
                'computed_score',
                computed_score,
                'questionnaire_score: ',
                questionnaire_score,
            );
            return Math.round(computed_score / scores.length);
        }
    }

    computationResult(type: string, answers: string, score: any) {
        let final_response = {};
        let combined_score = 0;

        const questionnaire_score = this.quest_score(answers);
        let algo_type = type;
        let myScores: number[] | number = [];
        if (Array.isArray(score) === false) {
            myScores.push(score);
        } else {
            myScores = score;
        }

        combined_score = this.cndp_computation(type, myScores, questionnaire_score);

        final_response = {
            computation_score: combined_score,
            questionnaire_score: questionnaire_score,
        };

        return final_response;
    }
}
