import { ApiProperty } from "@nestjs/swagger";

export class SchoolClassDetailedSummaryDto {
    
    @ApiProperty({ description: 'Código do Eixo', example: 'ES' })
    axisCode: string

    @ApiProperty({ description: 'Nome do Eixo', example: 'Consciência Fonológica' })
    axisName: string;

    @ApiProperty({ description: 'Quantidade de alunos com resultado Muito abaixo do esperado' })
    veryLow: number;

    @ApiProperty({ description: 'Quantidade de alunos com resultado Abaixo do esperado' })
    below: number;

    @ApiProperty({ description: 'Quantidade de alunos com resultado Esperado' })
    expected: number;
}
