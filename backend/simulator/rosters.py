from backend.models.schemas import Team, Player


def get_premier_league_teams() -> tuple[Team, Team]:
    arsenal_players = [
        Player(id="ars_1", name="David Raya", number=22, team_id="arsenal", position="GK"),
        Player(id="ars_2", name="Ben White", number=4, team_id="arsenal", position="RB"),
        Player(id="ars_3", name="William Saliba", number=2, team_id="arsenal", position="CB"),
        Player(id="ars_4", name="Gabriel Magalhães", number=6, team_id="arsenal", position="CB"),
        Player(id="ars_5", name="Jurriën Timber", number=12, team_id="arsenal", position="LB"),
        Player(id="ars_6", name="Thomas Partey", number=5, team_id="arsenal", position="CDM"),
        Player(id="ars_7", name="Declan Rice", number=41, team_id="arsenal", position="CM"),
        Player(id="ars_8", name="Martin Ødegaard", number=8, team_id="arsenal", position="CAM"),
        Player(id="ars_9", name="Bukayo Saka", number=7, team_id="arsenal", position="RW"),
        Player(id="ars_10", name="Gabriel Martinelli", number=11, team_id="arsenal", position="LW"),
        Player(id="ars_11", name="Kai Havertz", number=29, team_id="arsenal", position="ST"),
    ]

    arsenal = Team(
        id="arsenal",
        name="Arsenal FC",
        short_name="ARS",
        primary_color="#EF0107",
        secondary_color="#063672",
        formation="4-3-3",
        roster=arsenal_players,
    )

    mancity_players = [
        Player(id="mci_1", name="Ederson", number=31, team_id="mancity", position="GK"),
        Player(id="mci_2", name="Kyle Walker", number=2, team_id="mancity", position="RB"),
        Player(id="mci_3", name="Rúben Dias", number=3, team_id="mancity", position="CB"),
        Player(id="mci_4", name="Manuel Akanji", number=25, team_id="mancity", position="CB"),
        Player(id="mci_5", name="Josko Gvardiol", number=24, team_id="mancity", position="LB"),
        Player(id="mci_6", name="Rodri", number=16, team_id="mancity", position="CDM"),
        Player(id="mci_7", name="Mateo Kovacic", number=8, team_id="mancity", position="CM"),
        Player(id="mci_8", name="Kevin De Bruyne", number=17, team_id="mancity", position="CAM"),
        Player(id="mci_9", name="Phil Foden", number=47, team_id="mancity", position="RW"),
        Player(id="mci_10", name="Jérémy Doku", number=11, team_id="mancity", position="LW"),
        Player(id="mci_11", name="Erling Haaland", number=9, team_id="mancity", position="ST"),
    ]

    mancity = Team(
        id="mancity",
        name="Manchester City",
        short_name="MCI",
        primary_color="#6CABDD",
        secondary_color="#1C2C5B",
        formation="4-2-3-1",
        roster=mancity_players,
    )

    return arsenal, mancity
