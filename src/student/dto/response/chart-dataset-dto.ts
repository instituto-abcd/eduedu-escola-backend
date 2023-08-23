import { ApiProperty } from '@nestjs/swagger';

export class ChartDatasetDto {
  @ApiProperty({
    type: String,
    example: 'Consciência Fonológica', // Replace with the actual example value
  })
  label: string;

  @ApiProperty({ type: [Number], isArray: true }) // Change the type to an array of numbers
  data: number[]; // Adjust the type to be an array of numbers

  @ApiProperty({
    type: Number,
    example: 2, // Replace with the actual example value
  })
  borderWidth: number;
}
