import { Module } from "@nestjs/common";
import { DateFormatterUtilsService } from "./date-formatter-utils.service";

@Module({
    providers: [DateFormatterUtilsService],
    exports: [DateFormatterUtilsService]
})
export class UtilsModule { }