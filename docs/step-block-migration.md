# Unificação dos componentes das etapas

`public.step_blocks` é a fonte canônica. A migração `0007_unify_step_blocks.sql` copia os registros válidos de `funnel_steps.settings.textBlocks` para blocos `Texto`, preserva a ordem dos textos e mantém todos os blocos canônicos que já existiam. Os textos convertidos são acrescentados depois dos blocos existentes, em posições consecutivas.

Antes de remover a chave legada das configurações, a migração salva o `settings` original, o array legado e os UUIDs criados em `private.step_text_blocks_legacy_backup`. A migração é transacional e uma etapa respaldada não é migrada de novo. A chave antiga só é removida após a cópia dos registros.

## Conferência somente leitura

```sql
select s.id, s.title,
       jsonb_typeof(s.settings->'textBlocks') as legacy_type,
       coalesce(jsonb_array_length(s.settings->'textBlocks'), 0) as remaining_legacy,
       count(b.id) as canonical_blocks
from public.funnel_steps s
left join public.step_blocks b on b.step_id = s.id
group by s.id, s.title, s.settings
order by s.title;

select step_id, jsonb_array_length(legacy_text_blocks) as backed_up_entries,
       cardinality(migrated_block_ids) as migrated_text_blocks, backed_up_at
from private.step_text_blocks_legacy_backup;
```

## Rollback manual

Faça rollback somente se os blocos migrados ainda não foram editados. Execute em uma transação e confira primeiro os UUIDs em `migrated_block_ids`:

```sql
begin;
delete from public.step_blocks b
using private.step_text_blocks_legacy_backup backup
where b.id = any(backup.migrated_block_ids);

update public.funnel_steps s
set settings = backup.original_settings, updated_at = now()
from private.step_text_blocks_legacy_backup backup
where s.id = backup.step_id;
commit;
```

Os blocos que existiam antes da migração não estão nessa lista e não são removidos pelo rollback.

## Sincronização do editor

O editor sincroniza cada etapa por uma função transacional que atualiza UUIDs existentes, cria os blocos novos, remove os excluídos e atribui posições sem colisão. A versão `funnel_steps.updated_at` funciona como controle otimista: uma gravação feita sobre uma revisão antiga falha para evitar sobrescrita silenciosa.

Migração aplicada ao projeto Supabase `izquiz` em 2026-11-11. A verificação confirmou 3 etapas migradas, 19 textos convertidos, 19 entradas guardadas no backup privado, nenhuma chave `textBlocks` restante e preservação do FAQ canônico preexistente. A função `sync_step_blocks` está criada.
