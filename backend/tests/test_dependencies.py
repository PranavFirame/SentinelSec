import pytest
from backend.app.scanner.dependencies.parser import (
    parse_requirements_txt,
    parse_package_lock_json,
    parse_poetry_lock
)
from backend.app.scanner.dependencies.scanner import DependencyScanner
from backend.app.scanner.dependencies.osv_client import OSVAdvisoryProvider, VulnerabilityAdvisory


def test_parse_requirements_txt():
    content = """
    # Production dependencies
    flask==2.2.2
    requests>=2.28.0
    jinja2==3.1.2
    urllib3
    """
    items = parse_requirements_txt(content)
    names = {i.name: i for i in items}
    
    assert "flask" in names
    assert names["flask"].version == "2.2.2"
    assert names["flask"].is_exact is True

    assert "requests" in names
    assert names["requests"].is_exact is False

    assert "jinja2" in names
    assert names["jinja2"].version == "3.1.2"


def test_parse_package_lock_json():
    content = """
    {
      "name": "sample-app",
      "version": "1.0.0",
      "lockfileVersion": 3,
      "packages": {
        "": {
          "name": "sample-app"
        },
        "node_modules/axios": {
          "version": "0.21.1"
        },
        "node_modules/lodash": {
          "version": "4.17.20"
        }
      }
    }
    """
    items = parse_package_lock_json(content)
    assert len(items) == 2
    pkg_map = {i.name: i.version for i in items}
    assert pkg_map["axios"] == "0.21.1"
    assert pkg_map["lodash"] == "4.17.20"


def test_parse_poetry_lock():
    content = """
    [[package]]
    name = "certifi"
    version = "2022.12.7"
    description = "Python package for providing Mozilla's CA Bundle."

    [[package]]
    name = "cryptography"
    version = "39.0.1"
    """
    items = parse_poetry_lock(content)
    assert len(items) == 2
    names = [i.name for i in items]
    assert "certifi" in names
    assert "cryptography" in names


@pytest.mark.asyncio
async def test_dependency_scanner_with_mock_provider(mocker):
    mock_provider = OSVAdvisoryProvider()
    async def mock_query(items):
        return {
            "lodash": [
                VulnerabilityAdvisory(
                    vuln_id="GHSA-35jh-r3h4-6jhm",
                    aliases=["CVE-2021-23337"],
                    summary="Command Injection in lodash",
                    details="Lodash versions prior to 4.17.21 are vulnerable to Command Injection via template.",
                    severity="high",
                    cvss_score=7.2,
                    package_name="lodash",
                    package_version="4.17.20",
                    ecosystem="npm",
                    fixed_versions=["4.17.21"],
                    references=["https://nvd.nist.gov/vuln/detail/CVE-2021-23337"]
                )
            ]
        }
    mocker.patch.object(mock_provider, "query_dependencies", side_effect=mock_query)

    scanner = DependencyScanner(provider=mock_provider)
    content = '{"lockfileVersion": 3, "packages": {"node_modules/lodash": {"version": "4.17.20"}}}'
    res = await scanner.scan_manifest("package-lock.json", content)

    assert res.total_dependencies == 1
    assert res.vulnerabilities_found == 1
    assert res.findings[0].rule_id == "CVE-2021-23337"
    assert res.findings[0].severity.value == "high"
    assert res.score_data["final_score"] < 100
