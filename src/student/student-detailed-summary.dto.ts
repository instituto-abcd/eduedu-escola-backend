import { ApiProperty } from "@nestjs/swagger";

export class StudentDetailedSummaryDto {
    
    @ApiProperty({ description: 'Desempenho do Aluno por Área' })
    performanceByArea: StudentPerformanceByAreaDto[] = [];

    @ApiProperty({ description: 'Planetas' })
    summaries: StudentSummaryDto[] = [];
}

export class StudentPerformanceByAreaDto {
    @ApiProperty({ description: 'Código do Eixo', example: 'ES' })
    axisCode: string

    @ApiProperty({ description: 'Nome do Eixo', example: 'Consciência Fonológica' })
    axisName: string;

    @ApiProperty({ description: 'Média de estrelas', example: 4.5 })
    percent: number;

    @ApiProperty({ description: 'Desempenho em texto', example: 'Muito abaixo' })
    description: string;

    @ApiProperty({ description: 'Cor Hexadecimal', example: '#FF922B' })
    color: string;
}

export class StudentSummaryDto {
    @ApiProperty({ description: 'Código do Eixo', example: 'ES' })
    axisCode: string

    @ApiProperty({ description: 'Resumo do Aluno' })
    summary: string;
}