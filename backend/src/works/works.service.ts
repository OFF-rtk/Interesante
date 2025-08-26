import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

// You would define a DTO for creating/updating a work
export class CreateWorkDto {
  title: string;
  content_url: string;
  content_type: 'video' | 'image' | 'text';
}

@Injectable()
export class WorksService {
  private supabaseClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.supabaseClient = new SupabaseClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_KEY')!,
    );
  }

  async create(createWorkDto: CreateWorkDto, userId: string) {
    const { data, error } = await this.supabaseClient
      .from('works')
      .insert([{ ...createWorkDto, user_id: userId }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create work: ${error.message}`);
    }
    return data;
  }

  async findAll(userId: string) {
    const { data, error } = await this.supabaseClient
      .from('works')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch works: ${error.message}`);
    }
    return data;
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await this.supabaseClient
      .from('works')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new NotFoundException(`Work with ID ${id} not found.`);
    }
    if (data.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to access this work.');
    }
    return data;
  }

  async update(id: string, updateWorkDto: Partial<CreateWorkDto>, userId: string) {
    // First, verify the user owns the work
    await this.findOne(id, userId);

    const { data, error } = await this.supabaseClient
      .from('works')
      .update(updateWorkDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update work: ${error.message}`);
    }
    return data;
  }

  async remove(id: string, userId: string) {
    // First, verify the user owns the work
    await this.findOne(id, userId);

    const { error } = await this.supabaseClient
      .from('works')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete work: ${error.message}`);
    }
    return { message: 'Work successfully deleted.' };
  }

  async search(searchTerm: string, userId: string) {
    const { data, error } = await this.supabaseClient.rpc('search_my_works', {
      search_term: searchTerm,
    });

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
    return data;
  }
}