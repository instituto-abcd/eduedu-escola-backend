export class StudentPerformanceDefinitionDto {
    description: string;
    color: string;

    constructor(description: string, color: string) {
        this.description = description;
        this.color = color;
    }
}