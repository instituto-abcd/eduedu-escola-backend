import { ApiProperty } from "@nestjs/swagger";

export class SchoolClassDetailedSummaryDto {
    
    @ApiProperty({ description: 'Código do Eixo', example: 'ES' })
    axisCode: string

    @ApiProperty({ description: 'Nome do Eixo', example: 'Consciência Fonológica' })
    axisName: string;

    @ApiProperty({ description: 'Alunos com resultado Muito abaixo do esperado' })
    veryLow: any;

    @ApiProperty({ description: 'Alunos com resultado Abaixo do esperado' })
    below: any;

    @ApiProperty({ description: 'Alunos com resultado Esperado' })
    expected: any;
}

export class ClassificationDetailedSummaryDto {
    @ApiProperty({ description: 'Quantidade de alunos na classificação' })
    count: number

    @ApiProperty({ description: 'Alunos na classificação' })
    students: StudentDetailedSummaryDto[] = [];
}

export class StudentDetailedSummaryDto {

    @ApiProperty({ description: 'Id do aluno', example: '1358fedb-81b9-4614-9a22-3dcde96a238d' })
    studentId: string;
    
    @ApiProperty({ description: 'Nome do aluno', example: 'Dênis o Pimentinha' })
    name: string;

    @ApiProperty({ description: 'Data da última execução de prova' })
    lastExamDate: Date;

    @ApiProperty({ description: 'Percentual de Desempenho no Eixo' })
    percent: number;
}