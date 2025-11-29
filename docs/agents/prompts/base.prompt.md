Todas features, refactors ou alterações na base de código devem seguir o seguinte passo a passo:

1 - Análise da feature ou alteração solicitada e veja se já está implementada ou se condiz com a realidade do projeto. Em outras palavras, verifique se a feature ou alteração faz sentido de acordo com a base de código atual.
1.1 - Em caso de alteração ou nova feature, primeiro reproduza o que desejamos através de um teste unitário de como é esperado o comportamento (1 arquivo por feature). Ou seja, trabalhamos com TDD (Test Driven Development) sempre que possível. Caso seja uma exceção, solicite aprovação prévia.
1.2 - Após escrever o teste, deixe-o falhar, pois ainda não temos a implementação.
1.3 - Planeje e implemente a feature, seguindo boas práticas, a estrutura que temos, sem excesso de comentários (preferível clean code do que muitos comentários, se tiver comentário sempre conciso, apenas uma linha em lowercase).
1.4 - Tudo que for criado deve ser componentizado, seguindo a estrutura atual que temos, atomic design, teste unitário dos novos componentes e features.
1.5 - Após implementar a feature, rode o teste novamente e caso dê sucesso, revise se não faltou nenhum detalhe. Caso esteja tudo correto, verifique o README.md ou documentação relacionada para ver se é necessário atualizar algo relacionado à nova feature ou alteração.
1.6 - Atualize a documentação do projeto, se necessário, para refletir as mudanças feitas.
1.7 - Registre as alterações no changelog do projeto (a menos que seja uma alteração trivial).
1.8 - Avance para a próxima feature ou alteração mapeada.
1.9 - Ao final, faça uma revisão geral do código para garantir que tudo esteja em conformidade com os padrões do projeto antes de submeter para revisão de código (code review).
1.10 - Retorne um resumo das alterações feitas, incluindo links para os testes unitários e documentação atualizada, se aplicável.
