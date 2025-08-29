import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class IntakeAgentService {
    private readonly logger = new Logger('🤖 IntakeAgent');

    constructor() {
        this.logger.log('Intake Agent initialized and ready for action!');
    }

    async validateYoutubeUrl(url: string): Promise<{ valid: boolean; message: string}> {
        this.logger.log(`Validating Youtube URL: ${url}`);

        const ytRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:\S+)?$/;

        if(ytRegex.test(url)) {
            this.logger.log('✅ Valid YouTube URL format detected')
            return { valid: true, message: 'Valid YouTube URL detected' };
        } else {
            this.logger.warn('❌ Invalid YouTube URL format');
            return { valid: false, message: 'Invalid YouTube URL format' };
        }
    }
}
