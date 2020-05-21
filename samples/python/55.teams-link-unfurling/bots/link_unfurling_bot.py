# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
import uuid

from botbuilder.core import TurnContext, CardFactory
from botbuilder.core.card_factory import ContentTypes
from botbuilder.core.teams import TeamsActivityHandler
from botbuilder.schema import ThumbnailCard, CardImage, HeroCard
from botbuilder.schema.teams import (
    AppBasedLinkQuery,
    MessagingExtensionQuery,
    MessagingExtensionAttachment,
    MessagingExtensionResult,
    MessagingExtensionResponse,
    Tab,
)
from botbuilder.schema.teams.additional_properties import ContentType


class LinkUnfurlingBot(TeamsActivityHandler):
    async def on_teams_app_based_link_query(
        self, turn_context: TurnContext, query: AppBasedLinkQuery
    ):
        # A card response or a Tab response, or both, can be sent.
        # This sample is sending both.

        # create the Card attachment
        card = ThumbnailCard(
            title="Thumbnail Card",
            text=query.url,
            images=[
                CardImage(
                    url="https://raw.githubusercontent.com/microsoft/botframework-sdk/master/icon.png"
                )
            ],
        )

        card_attachment = MessagingExtensionAttachment(
            content_type=ContentTypes.hero_card, content=card
        )

        # create the Tab attachment
        tab = Tab(
            entity_id=str(uuid.uuid4()),
            name="Links",
            content_url="https://github.com/microsoft/botframework-sdk/blob/master/README.md",
            website_url="https://github.com/microsoft/botframework-sdk",
            remove_url="https://github.com/microsoft/botframework-sdk/blob/master/Contributing.md",
        )

        tab_attachment = MessagingExtensionAttachment(
            content_type=ContentType.TAB_UNFURLING, content=tab,
        )

        # the result is the card and tab attachments
        result = MessagingExtensionResult(
            attachment_layout="list",
            type="result",
            attachments=[card_attachment, tab_attachment],
        )
        return MessagingExtensionResponse(compose_extension=result)

    async def on_teams_messaging_extension_query(
        self, turn_context: TurnContext, query: MessagingExtensionQuery
    ):
        # These commandIds are defined in the Teams App Manifest.
        if not query.command_id == "searchQuery":
            raise NotImplementedError(f"Invalid CommandId: {query.command_id}")

        card = HeroCard(
            title="This is a Link Unfurling Sample",
            subtitle="It will unfurl links from *.BotFramework.com",
            text="This sample demonstrates how to handle link unfurling in Teams.  Please review the readme for more "
            "information. ",
        )

        return MessagingExtensionResponse(
            compose_extension=MessagingExtensionResult(
                attachment_layout="list",
                type="result",
                attachments=[
                    MessagingExtensionAttachment(
                        content=card,
                        content_type=ContentTypes.hero_card,
                        preview=CardFactory.hero_card(card),
                    )
                ],
            )
        )
