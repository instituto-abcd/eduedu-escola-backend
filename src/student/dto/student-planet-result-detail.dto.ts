import { ApiProperty } from "@nestjs/swagger";

export class StudentPlanetResultDetailDto {
    
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

    @ApiProperty({ description: 'Planetas' })
    planets: PlanetDetail[];
}

export class PlanetDetail {
    @ApiProperty({ description: 'ID do Planeta', example: 'uuid' })
    planetId: string;

    @ApiProperty({ description: 'Nome do Planeta', example: 'Marte' })
    planetName: string;

    @ApiProperty({ description: 'Estrelas obtidas no planeta', example: 4.5 })
    stars: number;
}