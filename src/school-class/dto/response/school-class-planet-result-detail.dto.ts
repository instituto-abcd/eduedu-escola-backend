import { ApiProperty } from "@nestjs/swagger";

export class SchoolClassPlanetResultDetailDto {
    
    @ApiProperty({ description: 'Código do Eixo', example: 'ES' })
    axisCode: string

    @ApiProperty({ description: 'Nome do Eixo', example: 'Consciência Fonológica' })
    axisName: string;

    @ApiProperty({ description: 'Planetas oferecidos', example: 12 })
    offeredPlanets: number;

    @ApiProperty({ description: 'Planetas realizados', example: 7 })
    accomplishedPlanets: number;

    @ApiProperty({ description: 'Média de estrelas', example: 4.5 })
    averageStars: number;
}
