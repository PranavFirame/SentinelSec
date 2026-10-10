import json
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class DependencyItem:
    name: str
    version: str
    ecosystem: str  # "npm" or "PyPI"
    is_exact: bool
    manifest_source: str


class ManifestParseError(Exception):
    pass


def parse_requirements_txt(content: str) -> List[DependencyItem]:
    """
    Parses Python requirements.txt file.
    Extracts package name and exact or bounded versions.
    """
    items: List[DependencyItem] = []
    lines = content.splitlines()

    for line in lines:
        raw_line = line.strip()
        # Strip comments
        if not raw_line or raw_line.startswith("#") or raw_line.startswith("-r") or raw_line.startswith("-i"):
            continue

        # Look for exact pin ==
        exact_match = re.match(r"^([a-zA-Z0-9_\-\.]+)\s*==\s*([a-zA-Z0-9_\-\.\+]+)", raw_line)
        if exact_match:
            pkg_name, version = exact_match.groups()
            items.append(DependencyItem(
                name=pkg_name.lower(),
                version=version,
                ecosystem="PyPI",
                is_exact=True,
                manifest_source="requirements.txt"
            ))
            continue

        # Compatible pin ~= or >=
        range_match = re.match(r"^([a-zA-Z0-9_\-\.]+)\s*([><=~!^].*)", raw_line)
        if range_match:
            pkg_name, spec = range_match.groups()
            items.append(DependencyItem(
                name=pkg_name.lower(),
                version=spec.strip(),
                ecosystem="PyPI",
                is_exact=False,
                manifest_source="requirements.txt"
            ))
            continue

        # Plain name without version
        plain_match = re.match(r"^([a-zA-Z0-9_\-\.]+)", raw_line)
        if plain_match:
            pkg_name = plain_match.group(1)
            items.append(DependencyItem(
                name=pkg_name.lower(),
                version="*",
                ecosystem="PyPI",
                is_exact=False,
                manifest_source="requirements.txt"
            ))

    return items


def parse_package_lock_json(content: str) -> List[DependencyItem]:
    """
    Parses npm package-lock.json (supporting formats v1, v2, v3) or npm-shrinkwrap.json.
    """
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        raise ManifestParseError(f"Invalid JSON in package-lock.json: {str(e)}")

    items: List[DependencyItem] = []
    seen = set()

    # V2/V3 format: 'packages' field
    if "packages" in data and isinstance(data["packages"], dict):
        for path_key, meta in data["packages"].items():
            if not path_key:  # root package ""
                continue
            if "version" in meta and isinstance(meta["version"], str):
                # Clean path_key from 'node_modules/foo/node_modules/bar' -> 'bar'
                name = meta.get("name")
                if not name:
                    parts = path_key.split("node_modules/")
                    name = parts[-1] if len(parts) > 1 else path_key

                key = (name.lower(), meta["version"])
                if key not in seen and name:
                    seen.add(key)
                    items.append(DependencyItem(
                        name=name,
                        version=meta["version"],
                        ecosystem="npm",
                        is_exact=True,
                        manifest_source="package-lock.json"
                    ))

    # V1 format fallback: 'dependencies' field
    if not items and "dependencies" in data and isinstance(data["dependencies"], dict):
        def extract_v1_deps(deps: Dict[str, Any]):
            for name, meta in deps.items():
                if isinstance(meta, dict) and "version" in meta:
                    version = meta["version"]
                    key = (name.lower(), version)
                    if key not in seen:
                        seen.add(key)
                        items.append(DependencyItem(
                            name=name,
                            version=version,
                            ecosystem="npm",
                            is_exact=True,
                            manifest_source="package-lock.json"
                        ))
                    if "dependencies" in meta and isinstance(meta["dependencies"], dict):
                        extract_v1_deps(meta["dependencies"])

        extract_v1_deps(data["dependencies"])

    return items


def parse_poetry_lock(content: str) -> List[DependencyItem]:
    """
    Parses Poetry lockfile (poetry.lock).
    """
    items: List[DependencyItem] = []
    current_package = {}
    
    for line in content.splitlines():
        line = line.strip()
        if line == "[[package]]":
            if current_package.get("name") and current_package.get("version"):
                items.append(DependencyItem(
                    name=current_package["name"].lower(),
                    version=current_package["version"],
                    ecosystem="PyPI",
                    is_exact=True,
                    manifest_source="poetry.lock"
                ))
            current_package = {}
        elif "=" in line:
            k, v = [part.strip() for part in line.split("=", 1)]
            v_clean = v.strip('"\'')
            if k == "name":
                current_package["name"] = v_clean
            elif k == "version":
                current_package["version"] = v_clean

    if current_package.get("name") and current_package.get("version"):
        items.append(DependencyItem(
            name=current_package["name"].lower(),
            version=current_package["version"],
            ecosystem="PyPI",
            is_exact=True,
            manifest_source="poetry.lock"
        ))

    return items


def parse_manifest(filename: str, content: str) -> List[DependencyItem]:
    """
    Dispatches parser based on manifest filename.
    """
    fname_lower = filename.lower()
    if fname_lower.endswith("package-lock.json") or fname_lower.endswith("npm-shrinkwrap.json"):
        return parse_package_lock_json(content)
    elif fname_lower.endswith("requirements.txt") or fname_lower.endswith(".pip"):
        return parse_requirements_txt(content)
    elif fname_lower.endswith("poetry.lock"):
        return parse_poetry_lock(content)
    else:
        # Heuristic detection
        if content.strip().startswith("{") and "dependencies" in content:
            return parse_package_lock_json(content)
        elif "[[package]]" in content:
            return parse_poetry_lock(content)
        else:
            return parse_requirements_txt(content)
